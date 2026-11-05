import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import multer from "multer";
import { isAdminRequest } from "../middleware/auth";
import {
  PRESCRIPTION_STATUSES,
  Prescription,
  PrescriptionImage,
  type PrescriptionDoc,
  type PrescriptionStatus,
  type RequestedProduct,
} from "../models/prescription";
import { detectImageType } from "../utils/image";
import { newReference } from "../utils/reference";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Stops one account from filling the database with uploads.
const MAX_PER_DAY = 10;

// ---------------------------------------------------------------------------
// Upload parsing (multipart, in memory, hard limits) .
// ---------------------------------------------------------------------------
const parseImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_IMAGES,
    fileSize: MAX_IMAGE_BYTES,
    fields: 20,
    fieldSize: 20_000,
  },
}).array("images", MAX_IMAGES);

// Turns multer's errors into plain messages the shop can show.
export const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  parseImages(req, res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "One of the photos is too large. Please use photos under 5 MB."
          : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
            ? `You can upload up to ${MAX_IMAGES} photos.`
            : "We couldn't read the upload. Please try again.";
      return res.status(400).json({ error: message });
    }

    console.error("Prescription upload parse failed:", error);
    return res.status(400).json({ error: "We couldn't read the upload." });
  });
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const parseRequestedProducts = (raw: unknown): RequestedProduct[] => {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (p): p is RequestedProduct =>
          !!p &&
          Number.isInteger(p.productId) &&
          typeof p.name === "string" &&
          p.name.length > 0,
      )
      .slice(0, 10)
      .map((p) => ({ productId: p.productId, name: p.name.slice(0, 200) }));
  } catch {
    return [];
  }
};

// What the shop is allowed to see about a prescription (never the photos).
const toSummary = (doc: PrescriptionDoc & { _id: Types.ObjectId; createdAt?: Date }) => ({
  id: String(doc._id),
  reference: doc.reference,
  status: doc.status,
  patientName: doc.patientName,
  notes: doc.notes,
  imageCount: doc.imageCount,
  requestedProducts: doc.requestedProducts,
  pharmacistNote: doc.pharmacistNote,
  createdAt: doc.createdAt,
});

const isDuplicateKey = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

// ---------------------------------------------------------------------------
// Customer endpoints
// ---------------------------------------------------------------------------
export const createPrescription = async (req: Request, res: Response) => {
  const userId = res.locals.userId as string;

  try {
    const body = req.body as Record<string, unknown>;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const patientName = text(body.patientName, 100);
    const phone = text(body.phone, 20);
    const notes = text(body.notes, 1000);

    if (patientName.length < 2) {
      return res.status(400).json({ error: "Please enter the patient's name." });
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      return res.status(400).json({ error: "Please enter a valid phone number." });
    }
    if (body.consent !== "true") {
      return res
        .status(400)
        .json({ error: "Please confirm the consent statement to continue." });
    }
    if (files.length === 0) {
      return res
        .status(400)
        .json({ error: "Please add at least one photo of the prescription." });
    }

    // Judge each file by what it actually is, not by what the browser says.
    const images = [];
    for (const file of files) {
      const contentType = detectImageType(file.buffer);
      if (!contentType) {
        return res.status(400).json({
          error: "Only JPG, PNG or WEBP photos can be uploaded.",
        });
      }
      images.push({ contentType, size: file.buffer.length, data: file.buffer });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Prescription.countDocuments({
      userId,
      createdAt: { $gte: since },
    });
    if (recent >= MAX_PER_DAY) {
      return res.status(429).json({
        error:
          "You've reached today's upload limit. Please contact the pharmacy if you need help.",
      });
    }

    // The reference is random; on the (very unlikely) clash, try again.
    let prescription;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        prescription = await Prescription.create({
          userId,
          reference: newReference(),
          patientName,
          phone,
          notes,
          consentAt: new Date(),
          imageCount: images.length,
          requestedProducts: parseRequestedProducts(body.requestedProducts),
        });
        break;
      } catch (error) {
        if (!isDuplicateKey(error) || attempt === 3) throw error;
      }
    }
    if (!prescription) throw new Error("Could not create prescription");

    try {
      await PrescriptionImage.insertMany(
        images.map((image, index) => ({
          prescriptionId: prescription._id,
          index,
          ...image,
        })),
      );
    } catch (error) {
      // Never leave a prescription with no photos behind.
      await Prescription.deleteOne({ _id: prescription._id }).catch(() => {});
      throw error;
    }

    return res.status(201).json({
      id: String(prescription._id),
      reference: prescription.reference,
      status: prescription.status,
      createdAt: prescription.createdAt,
    });
  } catch (error) {
    console.error("createPrescription failed:", error);
    return res
      .status(500)
      .json({ error: "We couldn't save your prescription. Please try again." });
  }
};

export const listMine = async (_req: Request, res: Response) => {
  try {
    const docs = await Prescription.find({ userId: res.locals.userId as string })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({ prescriptions: docs.map(toSummary) });
  } catch (error) {
    console.error("listMine failed:", error);
    return res.status(500).json({ error: "Failed to load your prescriptions." });
  }
};

// Owner or admin only. Returns null (and has already replied) otherwise.
const loadAllowed = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: "Not found" });
    return null;
  }

  const doc = await Prescription.findById(id).lean();
  const userId = res.locals.userId as string;

  // 404 (not 403) for someone else's prescription: don't confirm it exists.
  if (!doc || (doc.userId !== userId && !isAdminRequest(req))) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  return doc;
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const doc = await loadAllowed(req, res);
    if (!doc) return;
    return res.status(200).json({ prescription: toSummary(doc) });
  } catch (error) {
    console.error("getOne failed:", error);
    return res.status(500).json({ error: "Failed to load the prescription." });
  }
};

export const getImage = async (req: Request, res: Response) => {
  try {
    const doc = await loadAllowed(req, res);
    if (!doc) return;

    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0 || index >= doc.imageCount) {
      return res.status(404).json({ error: "Not found" });
    }

    // Not .lean(): a hydrated document hands back a real Buffer for `data`.
    const image = await PrescriptionImage.findOne({
      prescriptionId: doc._id,
      index,
    });
    if (!image) return res.status(404).json({ error: "Not found" });

    // Who looked at someone's health data, and when.
    if (doc.userId !== (res.locals.userId as string)) {
      console.log(
        `[audit] ${res.locals.userId} viewed image ${index} of ${doc.reference}`,
      );
    }

    res.set({
      "Content-Type": image.contentType,
      // Private health data: never cached by the browser or a proxy.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    });
    return res.status(200).send(image.data);
  } catch (error) {
    console.error("getImage failed:", error);
    return res.status(500).json({ error: "Failed to load the photo." });
  }
};

// ---------------------------------------------------------------------------
// Pharmacist (admin) endpoints
// ---------------------------------------------------------------------------
export const adminQueue = async (req: Request, res: Response) => {
  try {
    const status = req.query.status;
    const filter =
      typeof status === "string" &&
      (PRESCRIPTION_STATUSES as readonly string[]).includes(status)
        ? { status }
        : { status: { $in: ["PENDING", "IN_REVIEW", "NEEDS_INFO"] } };

    // Oldest first: the one that has waited longest comes first.
    const docs = await Prescription.find(filter).sort({ createdAt: 1 }).limit(100).lean();

    return res.status(200).json({
      prescriptions: docs.map((doc) => ({
        ...toSummary(doc),
        // Staff need to be able to call the customer back.
        phone: doc.phone,
        userId: doc.userId,
        reviewedBy: doc.reviewedBy,
        reviewedAt: doc.reviewedAt,
      })),
    });
  } catch (error) {
    console.error("adminQueue failed:", error);
    return res.status(500).json({ error: "Failed to load the queue." });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const body = req.body as { status?: unknown; note?: unknown };
    if (
      typeof body.status !== "string" ||
      !(PRESCRIPTION_STATUSES as readonly string[]).includes(body.status)
    ) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const status = body.status as PrescriptionStatus;
    const note = text(body.note, 1000);

    // Asking for more info or rejecting needs a reason the customer can read.
    if ((status === "NEEDS_INFO" || status === "REJECTED") && !note) {
      return res
        .status(400)
        .json({ error: "Add a note so the customer knows what to do next." });
    }

    const doc = await Prescription.findByIdAndUpdate(
      id,
      {
        status,
        pharmacistNote: note,
        reviewedBy: res.locals.userId as string,
        reviewedAt: new Date(),
      },
      { returnDocument: "after" },
    ).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    console.log(`[audit] ${res.locals.userId} set ${doc.reference} to ${status}`);
    return res.status(200).json({ prescription: toSummary(doc) });
  } catch (error) {
    console.error("updateStatus failed:", error);
    return res.status(500).json({ error: "Failed to update the prescription." });
  }
};