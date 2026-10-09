import mongoose, { Schema, type Model } from "mongoose";

export const QuoteTypes = ["sales-order", "inquiry", "quote"] as const;
export const QuoteStatuses = ["new", "contacted", "quoted", "won", "lost"] as const;
export const EmailStatuses = ["pending", "sent", "failed", "skipped"] as const;

export type QuoteType = (typeof QuoteTypes)[number];
export type QuoteStatus = (typeof QuoteStatuses)[number];
export type QuoteEmailStatus = (typeof EmailStatuses)[number];

export type QuoteItem = {
  source: "catalog" | "custom";
  productId: number | null;
  name: string;
  unit: string;
  quantity: number;
  /** Whole currency units. null = customer did not give a price. */
  unitPrice: number | null;
  lineTotal: number | null;
};

export type QuotePlain = {
  reference: string;
  type: QuoteType;
  status: QuoteStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    location: string;
  };
  neededBy: string;
  items: QuoteItem[];
  /** Sum of the lines that have a price. */
  subtotal: number;
  unpricedItems: number;
  notes: string;
  emailStatus: QuoteEmailStatus;
  emailError: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const itemSchema = new Schema<QuoteItem>(
  {
    source: { type: String, enum: ["catalog", "custom"], required: true },
    productId: { type: Number, default: null },
    name: { type: String, required: true, maxlength: 200 },
    unit: { type: String, default: "", maxlength: 40 },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: null },
    lineTotal: { type: Number, default: null },
  },
  { _id: false },
);

const quoteSchema = new Schema<QuotePlain>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: QuoteTypes, required: true },
    status: { type: String, enum: QuoteStatuses, default: "new", index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      company: { type: String, default: "" },
      location: { type: String, default: "" },
    },
    neededBy: { type: String, default: "" },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    unpricedItems: { type: Number, default: 0 },
    notes: { type: String, default: "", maxlength: 5000 },
    emailStatus: { type: String, enum: EmailStatuses, default: "pending" },
    emailError: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Quote: Model<QuotePlain> =
  (mongoose.models.Quote as Model<QuotePlain> | undefined) ||
  mongoose.model<QuotePlain>("Quote", quoteSchema);
