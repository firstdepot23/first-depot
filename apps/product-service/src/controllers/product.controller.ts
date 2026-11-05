import { Request, Response } from "express";
import { prisma, Prisma, Segment } from "@repo/product-db";
import {
  normalizeLabel,
  parseOptionGroups,
  parseVariants,
  productInclude,
  summarizeVariants,
  syncVariants,
  toGroupCreate,
  toVariantCreate,
  type OptionGroupInput,
  type VariantInput,
} from "../utils/productExtras";

// Keep in sync with MAX_GALLERY_IMAGES in @repo/types.
const MAX_GALLERY_IMAGES = 8;
// Keep in sync with MAX_BULK_ITEMS in @repo/types.
const MAX_BULK_ITEMS = 200;
// Keep in sync with DEFAULT_IMAGE_KEY in @repo/types. Grocery / pharmacy
// products aren't sold by color, so their photo is stored under this key.
const DEFAULT_IMAGE_KEY = "default";

const VALID_SEGMENTS = Object.values(Segment);
const isValidSegment = (value: unknown): value is Segment =>
  typeof value === "string" && (VALID_SEGMENTS as string[]).includes(value);

const hasPrismaCode = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

// Returns an error message, or null when `gallery` is a valid
// { [color]: string[] } map.
const galleryError = (gallery: unknown): string | null => {
  if (typeof gallery !== "object" || gallery === null || Array.isArray(gallery)) {
    return "Gallery must be an object of photo lists per color";
  }
  for (const [color, urls] of Object.entries(gallery)) {
    if (
      !Array.isArray(urls) ||
      urls.some((u) => typeof u !== "string" || !u.trim())
    ) {
      return `Gallery for ${color} must be a list of image URLs`;
    }
    if (urls.length > MAX_GALLERY_IMAGES) {
      return `Too many extra photos for ${color} (max ${MAX_GALLERY_IMAGES})`;
    }
  }
  return null;
};

// ---------------------------------------------------------------------
// Shared cleanup for fields the forms send as plain strings.
// ---------------------------------------------------------------------

const DATE_FIELDS = ["manufacturingDate", "expiryDate"] as const;

// Optional text columns. A blank string is stored as null: `barcode` is
// unique, so two products with "" would collide.
const OPTIONAL_TEXT_FIELDS = [
  "supplier",
  "barcode",
  "batchNumber",
  "formulation",
  "dosageStrength",
  "activeIngredient",
  "manufacturer",
  "storageConditions",
  "registrationNumber",
] as const;

// "YYYY-MM-DD" -> Date (UTC midnight), or null when it isn't a real date.
const parseDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// The forms send dates as "YYYY-MM-DD"; Prisma needs Date objects. Mutates
// `data` in place and returns an error message when a date is invalid.
const normalizeDates = (data: Record<string, unknown>): string | null => {
  for (const key of DATE_FIELDS) {
    const value = data[key];
    if (value === undefined) continue;
    if (value === null || value === "") {
      data[key] = null;
      continue;
    }
    const date = typeof value === "string" ? parseDate(value) : null;
    if (!date) return `${key} must be a valid date (YYYY-MM-DD)`;
    data[key] = date;
  }
  return null;
};

const normalizeOptionalText = (data: Record<string, unknown>) => {
  for (const key of OPTIONAL_TEXT_FIELDS) {
    const value = data[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    data[key] = trimmed ? trimmed : null;
  }
};

const stockError = (stock: unknown): string | null =>
  typeof stock === "number" && Number.isInteger(stock) && stock >= 0
    ? null
    : "Stock must be a whole number of 0 or more";

export const createProduct = async (req: Request, res: Response) => {
  try {
    // Packs (grocery) and option groups (fast food) are saved together with
    // the product in one step, so they are taken out of the body first.
    const {
      variants: rawVariants,
      optionGroups: rawGroups,
      ...payload
    } = (req.body ?? {}) as Record<string, unknown>;
    const data = payload as unknown as Prisma.ProductCreateInput;

    // Omitted segment defaults to HARDWARE at the database level (see
    // schema.prisma), but validation here needs to know the effective
    // value up front, before the row is written.
    const segmentInput = payload.segment;
    if (segmentInput !== undefined && !isValidSegment(segmentInput)) {
      return res.status(400).json({ message: "Invalid segment" });
    }
    const segment: Segment = isValidSegment(segmentInput)
      ? segmentInput
      : Segment.HARDWARE;

    const { colors, images } = data;

    if (segment === Segment.HARDWARE) {
      // Unchanged from before this change: hardware products are sold by
      // color, so every color needs a matching image.
      if (!colors || !Array.isArray(colors) || colors.length === 0) {
        return res
          .status(400)
          .json({ message: "Colors array is required for hardware products!" });
      }
      if (!images || typeof images !== "object") {
        return res.status(400).json({ message: "Images object is required!" });
      }
      const missingColors = colors.filter((color) => !(color in images));
      if (missingColors.length > 0) {
        return res
          .status(400)
          .json({ message: "Missing images for colors!", missingColors });
      }
    } else {
      // Grocery / pharmacy / fast food aren't sold by color - just need one
      // photo.
      if (!images || typeof images !== "object" || Object.keys(images).length === 0) {
        return res.status(400).json({ message: "At least one image is required!" });
      }
    }

    if (segment === Segment.PHARMACY) {
      const body = payload as { batchNumber?: unknown; expiryDate?: unknown };
      if (!body.batchNumber) {
        return res
          .status(400)
          .json({ message: "Batch number is required for pharmacy products!" });
      }
      if (!body.expiryDate) {
        return res
          .status(400)
          .json({ message: "Expiry date is required for pharmacy products!" });
      }
    }

    const gallery = payload.gallery;
    if (gallery !== undefined) {
      const message = galleryError(gallery);
      if (message) return res.status(400).json({ message });
    }

    // Grocery: each pack size has its own price, cost and stock.
    let packs: VariantInput[] | undefined;
    if (rawVariants !== undefined) {
      if (segment !== Segment.GROCERY) {
        return res.status(400).json({
          message: "Pack sizes with their own prices are only for grocery products.",
        });
      }
      const parsed = parseVariants(rawVariants);
      if (!parsed.ok) return res.status(400).json({ message: parsed.message });
      packs = parsed.value;
    }

    // Fast food: accompaniments, substitutes and add-ons.
    let groups: OptionGroupInput[] | undefined;
    if (rawGroups !== undefined) {
      if (segment !== Segment.FASTFOOD) {
        return res.status(400).json({
          message: "Accompaniments and add-ons are only for fast food products.",
        });
      }
      const parsed = parseOptionGroups(rawGroups);
      if (!parsed.ok) return res.status(400).json({ message: parsed.message });
      groups = parsed.value;
    }

    const dateMessage = normalizeDates(payload);
    if (dateMessage) return res.status(400).json({ message: dateMessage });
    normalizeOptionalText(payload);
    if ("stock" in payload) {
      const message = stockError(payload.stock);
      if (message) return res.status(400).json({ message });
    }

    // With packs, the product row summarises them (lowest price, list of
    // pack labels, total stock) so code that only knows `price` / `sizes` /
    // `stock` keeps working.
    const summary = packs ? summarizeVariants(packs) : undefined;

    const product = await prisma.product.create({
      data: {
        ...(payload as unknown as Prisma.ProductUncheckedCreateInput),
        ...(summary
          ? {
              price: summary.price,
              sizes: summary.sizes,
              stock: summary.stock,
              ...(summary.costPrice !== null
                ? { costPrice: summary.costPrice }
                : {}),
            }
          : {}),
        ...(packs ? { variants: { create: packs.map(toVariantCreate) } } : {}),
        ...(groups && groups.length > 0
          ? { optionGroups: { create: groups.map(toGroupCreate) } }
          : {}),
      },
      include: productInclude,
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("createProduct failed:", error);
    if (hasPrismaCode(error, "P2002")) {
      return res
        .status(409)
        .json({ message: "A product or pack with this barcode already exists." });
    }
    return res.status(500).json({ message: "Failed to create product" });
  }
};

// ---------------------------------------------------------------------
// Bulk create: one supplier delivery = many products, each with the
// quantity supplied as its opening stock. Grocery and pharmacy only
// (hardware and fast food are added one at a time).
//
// GROCERY: lines with the same category and product name are ONE product
// sold in several packs. "Rice / 1 Kg / 50 / 4,500" and "Rice / 25 Kg / 4 /
// 95,000" become Rice with two packs, each with its own price and stock.
// PHARMACY: every line stays its own product (each has its own batch / expiry).
//
// All-or-nothing: if any line is invalid nothing is written.
// ---------------------------------------------------------------------

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const isWholeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

type BulkLine = {
  row: number;
  // Lines with the same key end up in the same product.
  key: string;
  size: string;
  data: Prisma.ProductUncheckedCreateInput;
  pack: VariantInput;
  // What the admin typed ("" when nothing), and the uploaded photo, if any.
  description: string;
  image: string;
};

const earliestDate = (dates: unknown[]): Date | null => {
  const real = dates.filter((d): d is Date => d instanceof Date);
  return real.length > 0
    ? new Date(Math.min(...real.map((d) => d.getTime())))
    : null;
};

export const createProductsBulk = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as {
      segment?: unknown;
      supplier?: unknown;
      items?: unknown;
    };

    if (
      !isValidSegment(body.segment) ||
      (body.segment !== Segment.GROCERY && body.segment !== Segment.PHARMACY)
    ) {
      return res.status(400).json({
        message: "Bulk entry is only for grocery and pharmacy products.",
      });
    }
    const segment = body.segment;
    const isPharmacy = segment === Segment.PHARMACY;

    const supplier = text(body.supplier);
    if (!supplier) {
      return res.status(400).json({ message: "Supplier is required" });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ message: "Add at least one product" });
    }
    if (body.items.length > MAX_BULK_ITEMS) {
      return res.status(400).json({
        message: `Too many products in one entry (max ${MAX_BULK_ITEMS})`,
      });
    }

    const problems: { row: number; message: string }[] = [];
    const lines: BulkLine[] = [];
    const seenBarcodes = new Map<string, number>();

    body.items.forEach((raw: unknown, index: number) => {
      const row = index + 1;
      const fail = (message: string) => problems.push({ row, message });

      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        return fail("Invalid entry");
      }
      const item = raw as Record<string, unknown>;

      const name = text(item.name);
      const size = text(item.size);
      const categorySlug = text(item.categorySlug);

      if (!name) fail("Product name is required");
      if (!size) fail("Size / unit is required");
      if (!categorySlug) fail("Category is required");
      if (!isWholeNumber(item.quantity) || item.quantity < 1) {
        fail("Quantity must be a whole number of at least 1");
      }
      if (!isWholeNumber(item.price) || item.price < 1) {
        fail("Selling price must be a whole number of at least 1");
      }
      if (
        item.costPrice !== undefined &&
        item.costPrice !== null &&
        (!isWholeNumber(item.costPrice) || item.costPrice < 0)
      ) {
        fail("Cost price must be a whole number of 0 or more");
      }

      const manufacturingText = text(item.manufacturingDate);
      const expiryText = text(item.expiryDate);
      const manufacturingDate = manufacturingText
        ? parseDate(manufacturingText)
        : null;
      const expiryDate = expiryText ? parseDate(expiryText) : null;
      if (manufacturingText && !manufacturingDate) {
        fail("Manufacturing date must be a valid date");
      }
      if (expiryText && !expiryDate) fail("Expiry date must be a valid date");

      const batchNumber = text(item.batchNumber);
      if (isPharmacy) {
        if (!batchNumber) fail("Batch number is required for pharmacy products");
        if (!expiryText) fail("Expiry date is required for pharmacy products");
      }

      const barcode = text(item.barcode);
      if (barcode) {
        const firstSeen = seenBarcodes.get(barcode);
        if (firstSeen !== undefined) {
          fail(`Barcode "${barcode}" is already used on row ${firstSeen}`);
        } else {
          seenBarcodes.set(barcode, row);
        }
      }

      const image = text(item.image);
      const description = text(item.description);

      // Every problem on this row is already queued above; a row with any
      // problem is never built, so nothing invalid reaches the database.
      if (problems.some((p) => p.row === row)) return;

      const data: Prisma.ProductUncheckedCreateInput = {
        segment,
        name,
        // The bulk table has no short-description column: derive one from
        // name + size (the column is limited to 60 characters).
        shortDescription: `${name} - ${size}`.slice(0, 60),
        description: description || `${name} (${size})`,
        price: item.price as number,
        sizes: [size],
        colors: [],
        images: image ? { [DEFAULT_IMAGE_KEY]: image } : {},
        gallery: {},
        categorySlug,
        costPrice: isWholeNumber(item.costPrice) ? item.costPrice : null,
        supplier,
        barcode: barcode || null,
        stock: item.quantity as number,
        batchNumber: batchNumber || null,
        manufacturingDate,
        expiryDate,
      };

      if (isPharmacy) {
        data.formulation = text(item.formulation) || null;
        data.dosageStrength = text(item.dosageStrength) || null;
        data.activeIngredient = text(item.activeIngredient) || null;
        data.manufacturer = text(item.manufacturer) || null;
        data.registrationNumber = text(item.registrationNumber) || null;
        data.storageConditions = text(item.storageConditions) || null;
        data.prescriptionRequired = item.prescriptionRequired === true;
      }

      lines.push({
        row,
        key: isPharmacy
          ? `row:${row}`
          : `${categorySlug}|${normalizeLabel(name)}`,
        size,
        data,
        pack: {
          label: size,
          price: item.price as number,
          costPrice: isWholeNumber(item.costPrice) ? item.costPrice : null,
          stock: item.quantity as number,
          barcode: barcode || null,
          sortOrder: 0,
        },
        description,
        image,
      });
    });

    const summarize = (list: { row: number; message: string }[]) => {
      const shown = list
        .slice(0, 5)
        .map((p) => `Row ${p.row}: ${p.message}`)
        .join("; ");
      return list.length > 5
        ? `${shown}; and ${list.length - 5} more problem(s)`
        : shown;
    };

    // Same product on several lines (grocery): each size may only appear once.
    const grouped = new Map<string, BulkLine[]>();
    for (const line of lines) {
      const list = grouped.get(line.key);
      if (list) list.push(line);
      else grouped.set(line.key, [line]);
    }
    for (const list of grouped.values()) {
      const seenSizes = new Map<string, number>();
      for (const line of list) {
        const sizeKey = normalizeLabel(line.size);
        const firstRow = seenSizes.get(sizeKey);
        if (firstRow !== undefined) {
          problems.push({
            row: line.row,
            message: `"${line.data.name}" already has a ${line.size} pack on row ${firstRow}`,
          });
        } else {
          seenSizes.set(sizeKey, line.row);
        }
      }
    }

    if (problems.length > 0) {
      problems.sort((a, b) => a.row - b.row);
      return res
        .status(400)
        .json({ message: summarize(problems), errors: problems });
    }

    // Every category must exist in THIS segment (the database would also
    // refuse, but with an error that can't say which row).
    const slugs = [...new Set(lines.map((l) => l.data.categorySlug))];
    const found = await prisma.category.findMany({
      where: { segment, slug: { in: slugs } },
      select: { slug: true },
    });
    const known = new Set(found.map((c) => c.slug));
    const unknown = lines
      .filter((l) => !known.has(l.data.categorySlug))
      .map((l) => ({
        row: l.row,
        message: `Category "${l.data.categorySlug}" doesn't exist in this segment`,
      }));
    if (unknown.length > 0) {
      return res
        .status(400)
        .json({ message: summarize(unknown), errors: unknown });
    }

    const productsData: Prisma.ProductUncheckedCreateInput[] = [
      ...grouped.values(),
    ].map((list) => {
      const first = list[0]!.data;
      // Pharmacy: one line = one product, exactly as before.
      if (isPharmacy) return first;

      const packs = list.map((line, index) => ({ ...line.pack, sortOrder: index }));
      const summary = summarizeVariants(packs);
      const photo = list.map((line) => line.image).find(Boolean);
      const description =
        list.map((line) => line.description).find(Boolean) ??
        (packs.length > 1 ? first.name : `${first.name} (${packs[0]!.label})`);
      const batches = [
        ...new Set(
          list.map((line) => (line.data.batchNumber as string | null) ?? "").filter(Boolean),
        ),
      ];

      return {
        ...first,
        shortDescription: `${first.name} - ${packs.map((p) => p.label).join(", ")}`.slice(0, 60),
        description,
        price: summary.price,
        sizes: summary.sizes,
        stock: summary.stock,
        costPrice: summary.costPrice,
        images: photo ? { [DEFAULT_IMAGE_KEY]: photo } : {},
        // Barcodes belong to the individual packs now.
        barcode: null,
        // Batch / expiry are tracked per product: if the packs came from
        // different batches, list them all and use the earliest expiry so
        // nothing is overlooked.
        batchNumber: batches.length > 0 ? batches.join(", ") : null,
        manufacturingDate: earliestDate(
          list.map((line) => line.data.manufacturingDate),
        ),
        expiryDate: earliestDate(list.map((line) => line.data.expiryDate)),
        variants: { create: packs.map(toVariantCreate) },
      };
    });

    const products = await prisma.$transaction(
      productsData.map((data) =>
        prisma.product.create({ data, include: productInclude }),
      ),
    );

    return res.status(201).json({
      created: products.length,
      packs: lines.length,
      products,
    });
  } catch (error) {
    console.error("createProductsBulk failed:", error);
    if (hasPrismaCode(error, "P2002")) {
      return res.status(409).json({
        message:
          "One of the barcodes is already used by another product or pack. Nothing was added.",
      });
    }
    return res
      .status(500)
      .json({ message: "Failed to add the products. Nothing was added." });
  }
};

// Only these fields can be changed through the API (never id/createdAt).
// `segment` is deliberately NOT here: a product's segment and its category
// are tied together at the database level (see schema.prisma), so moving a
// product between segments needs its category changed in the same step,
// not a plain field update. Give that its own endpoint later if it's
// actually needed, rather than allowing it through this generic one.
const UPDATABLE_FIELDS = [
  "name",
  "shortDescription",
  "description",
  "price",
  "categorySlug",
  "sizes",
  "colors",
  "images",
  "gallery",
  "costPrice",
  "wholesalePrice",
  "supplier",
  "barcode",
  "stock",
  "batchNumber",
  "manufacturingDate",
  "expiryDate",
  "formulation",
  "dosageStrength",
  "activeIngredient",
  "manufacturer",
  "prescriptionRequired",
  "storageConditions",
  "registrationNumber",
] as const;

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of UPDATABLE_FIELDS) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const hasPacks = body.variants !== undefined;
    const hasGroups = body.optionGroups !== undefined;

    if (Object.keys(data).length === 0 && !hasPacks && !hasGroups) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    // Which segment is this product in? Packs are for grocery, option groups
    // for fast food, and fast food has no sizes.
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { segment: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Grocery packs replace the product's pack list. The product row then
    // just summarises them (lowest price, labels, total stock).
    let packs: VariantInput[] | undefined;
    if (hasPacks) {
      if (existing.segment !== Segment.GROCERY) {
        return res.status(400).json({
          message: "Pack sizes with their own prices are only for grocery products.",
        });
      }
      const parsed = parseVariants(body.variants);
      if (!parsed.ok) return res.status(400).json({ message: parsed.message });
      packs = parsed.value;

      const summary = summarizeVariants(packs);
      data.price = summary.price;
      data.sizes = summary.sizes;
      data.stock = summary.stock;
      if (summary.costPrice !== null) data.costPrice = summary.costPrice;
    }

    // Fast-food accompaniments replace the product's option groups.
    let groups: OptionGroupInput[] | undefined;
    if (hasGroups) {
      if (existing.segment !== Segment.FASTFOOD) {
        return res.status(400).json({
          message: "Accompaniments and add-ons are only for fast food products.",
        });
      }
      const parsed = parseOptionGroups(body.optionGroups);
      if (!parsed.ok) return res.status(400).json({ message: parsed.message });
      groups = parsed.value;
    }

    for (const key of ["name", "shortDescription", "description"] as const) {
      if (
        key in data &&
        (typeof data[key] !== "string" || !(data[key] as string).trim())
      ) {
        return res.status(400).json({ message: `${key} cannot be empty` });
      }
    }
    if (
      typeof data.shortDescription === "string" &&
      data.shortDescription.length > 60
    ) {
      return res
        .status(400)
        .json({ message: "Short description is too long (max 60)" });
    }
    if (
      "price" in data &&
      (typeof data.price !== "number" ||
        !Number.isFinite(data.price) ||
        data.price < 1)
    ) {
      return res.status(400).json({ message: "Price must be at least 1" });
    }
    if ("stock" in data) {
      const message = stockError(data.stock);
      if (message) return res.status(400).json({ message });
    }
    if (
      "sizes" in data &&
      (!Array.isArray(data.sizes) ||
        (data.sizes.length === 0 && existing.segment !== Segment.FASTFOOD))
    ) {
      return res.status(400).json({ message: "At least one size is required" });
    }
    // Colors can legitimately be set to [] here (grocery/pharmacy), so this
    // only rejects a non-array value, not an empty one.
    if ("colors" in data && !Array.isArray(data.colors)) {
      return res.status(400).json({ message: "Colors must be an array" });
    }
    if (
      "images" in data &&
      (typeof data.images !== "object" ||
        data.images === null ||
        Array.isArray(data.images))
    ) {
      return res.status(400).json({ message: "Images object is required!" });
    }
    if ("gallery" in data) {
      const message = galleryError(data.gallery);
      if (message) return res.status(400).json({ message });
    }
    // Only fires when colors is both present AND non-empty, so this is a
    // no-op for grocery/pharmacy products, which keep colors as [].
    if (Array.isArray(data.colors) && data.colors.length > 0 && data.images) {
      const images = data.images as Record<string, unknown>;
      const missingColors = (data.colors as string[]).filter(
        (color) => !images[color],
      );
      if (missingColors.length > 0) {
        return res
          .status(400)
          .json({ message: "Missing images for colors!", missingColors });
      }
    }

    const dateMessage = normalizeDates(data);
    if (dateMessage) return res.status(400).json({ message: dateMessage });
    normalizeOptionalText(data);

    // Product, packs and option groups change together or not at all.
    const updatedProduct = await prisma.$transaction(async (tx) => {
      if (packs) await syncVariants(tx, id, packs);
      if (groups) {
        await tx.productOptionGroup.deleteMany({ where: { productId: id } });
      }
      return tx.product.update({
        where: { id },
        data: {
          ...(data as unknown as Prisma.ProductUpdateInput),
          ...(groups && groups.length > 0
            ? { optionGroups: { create: groups.map(toGroupCreate) } }
            : {}),
        },
        include: productInclude,
      });
    });

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("updateProduct failed:", error);

    if (hasPrismaCode(error, "P2025")) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (hasPrismaCode(error, "P2002")) {
      return res
        .status(409)
        .json({ message: "A product or pack with this barcode already exists." });
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return res
        .status(400)
        .json({ message: "Some product details are invalid" });
    }

    return res.status(500).json({ message: "Failed to update product" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedProduct = await prisma.product.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json(deletedProduct);
  } catch (error) {
    console.error("deleteProduct failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(500).json({ message: "Failed to delete product" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  const { sort, category, search, limit, segment } = req.query;

  if (segment !== undefined && !isValidSegment(segment)) {
    return res.status(400).json({ message: "Invalid segment" });
  }

  const orderBy = (() => {
    switch (sort) {
      case "asc":
        return { price: Prisma.SortOrder.asc };
      case "desc":
        return { price: Prisma.SortOrder.desc };
      case "oldest":
        return { createdAt: Prisma.SortOrder.asc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  })();

  // Express can hand back an array or an object for a repeated/odd query
  // value; only a plain string is a real search.
  const term = typeof search === "string" ? search.trim() : "";

  try {
    const products = await prisma.product.findMany({
      where: {
        // No segment passed = every segment. The homepage / segment pages
        // (client, built later) are expected to always pass this, e.g.
        // ?segment=HARDWARE for the default home listing.
        segment: isValidSegment(segment) ? segment : undefined,
        category: category
          ? {
              slug: category as string,
            }
          : undefined,
        // A search matches the product's own name OR the name / slug of the
        // category it is filed under. Without the category part, searching
        // "kfc" finds nothing when the products in the "KFC" category don't
        // happen to have "KFC" in their own names.
        ...(term && {
          OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            {
              category: {
                OR: [
                  { name: { contains: term, mode: "insensitive" as const } },
                  { slug: { contains: term, mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }),
      },
      orderBy,
      take: limit ? Number(limit) : undefined,
      // Packs and fast-food option groups come with each product.
      include: productInclude,
    });

    // A genuinely empty table returns [] with no error — nothing extra
    // needed here. This only exists so a real failure (e.g. the DB being
    // unreachable) doesn't crash the request; the client still gets a
    // usable, empty response instead of a 500 with a stack trace.
    // If products are unexpectedly empty, look for "getProducts failed" in
    // this service's logs.
    return res.status(200).json(products);
  } catch (error) {
    console.error("getProducts failed:", error);
    // 503 (not an empty 200) so the client can retry instead of showing
    // "No products found" when the database is merely slow or waking up.
    return res
      .status(503)
      .json({ message: "Products are temporarily unavailable" });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: productInclude,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("getProduct failed:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};