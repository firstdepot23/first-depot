import mongoose, { Schema, Types } from "mongoose";

export const PRESCRIPTION_STATUSES = [
  "PENDING", // received, nobody has looked yet
  "IN_REVIEW", // a pharmacist is looking at it
  "NEEDS_INFO", // photo unclear / question for the customer (see pharmacistNote)
  "APPROVED", // valid: the pharmacist will arrange the order with the customer
  "REJECTED", // not valid / can't be dispensed (see pharmacistNote)
] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

export type RequestedProduct = { productId: number; name: string };

export type PrescriptionDoc = {
  userId: string;
  reference: string;
  patientName: string;
  phone: string;
  notes: string;
  consentAt: Date;
  imageCount: number;
  requestedProducts: RequestedProduct[];
  status: PrescriptionStatus;
  // Shown to the customer on "My prescriptions".
  pharmacistNote: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  // Added by `timestamps: true`.
  createdAt?: Date;
  updatedAt?: Date;
};

const requestedProductSchema = new Schema<RequestedProduct>(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const prescriptionSchema = new Schema<PrescriptionDoc>(
  {
    userId: { type: String, required: true, index: true },
    reference: { type: String, required: true, unique: true },
    patientName: { type: String, required: true, maxlength: 100 },
    phone: { type: String, required: true },
    notes: { type: String, default: "", maxlength: 1000 },
    consentAt: { type: Date, required: true },
    imageCount: { type: Number, required: true, min: 1, max: 5 },
    requestedProducts: { type: [requestedProductSchema], default: [] },
    status: {
      type: String,
      enum: PRESCRIPTION_STATUSES,
      default: "PENDING",
      index: true,
    },
    pharmacistNote: { type: String, default: "", maxlength: 1000 },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

export const Prescription =
  (mongoose.models.Prescription as mongoose.Model<PrescriptionDoc>) ||
  mongoose.model<PrescriptionDoc>("Prescription", prescriptionSchema);

// The photos live in their own collection so listing prescriptions never
// drags megabytes of image data along with it.
export type PrescriptionImageDoc = {
  prescriptionId: Types.ObjectId;
  index: number;
  contentType: string;
  size: number;
  data: Buffer;
};

const imageSchema = new Schema<PrescriptionImageDoc>(
  {
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
    },
    index: { type: Number, required: true, min: 0, max: 4 },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);
imageSchema.index({ prescriptionId: 1, index: 1 }, { unique: true });

export const PrescriptionImage =
  (mongoose.models.PrescriptionImage as mongoose.Model<PrescriptionImageDoc>) ||
  mongoose.model<PrescriptionImageDoc>("PrescriptionImage", imageSchema);