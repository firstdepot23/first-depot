import { z } from "zod";

export const QUOTE_TYPES = ["sales-order", "inquiry", "quote"] as const;
export type QuoteKind = (typeof QUOTE_TYPES)[number];

export const QUOTE_TYPE_INFO: Record<
  QuoteKind,
  { label: string; blurb: string }
> = {
  "sales-order": {
    label: "Sales order",
    blurb: "Ready to buy. We confirm stock, the total and delivery.",
  },
  inquiry: {
    label: "Inquiry",
    blurb: "Ask about availability, prices or alternatives.",
  },
  quote: {
    label: "Written quote",
    blurb: "Describe your project or paste your BOQ and we price it.",
  },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const quoteItemSchema = z.object({
  productId: z.number().int().positive().nullable(),
  name: z.string().trim().min(1, "Describe the item").max(200),
  unit: z.string().trim().max(40),
  quantity: z
    .number({ message: "Enter a quantity" })
    .positive("Quantity must be more than 0")
    .max(1_000_000, "Quantity is too large"),
  unitPrice: z.number().min(0).max(1_000_000_000).nullable(),
});

export const quoteRequestSchema = z
  .object({
    type: z.enum(QUOTE_TYPES),
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z
      .string()
      .trim()
      .max(200)
      .regex(EMAIL, "Enter a valid email address"),
    phone: z.string().trim().min(6, "Enter a phone number").max(30),
    company: z.string().trim().max(120),
    location: z.string().trim().max(200),
    neededBy: z
      .string()
      .trim()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Pick a valid date"),
    items: z.array(quoteItemSchema).max(100, "Up to 100 items per request"),
    notes: z.string().trim().max(5000, "Notes are too long (max 5000)"),
    // Honeypot: real people never see or fill this.
    website: z.string().max(200),
  })
  .superRefine((v, ctx) => {
    if (v.type === "sales-order" && v.items.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Add at least one item to place a sales order",
      });
    } else if (v.items.length === 0 && v.notes.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["notes"],
        message: "Add items to the table or describe what you need",
      });
    }
  });

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;

export type QuoteFieldErrors = Record<string, string>;

/** Flatten zod issues into "name" / "items.2.quantity" -> message. */
export const issuesToErrors = (
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): QuoteFieldErrors => {
  const out: QuoteFieldErrors = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".") || "form";
    if (!(key in out)) out[key] = i.message;
  }
  return out;
};

export type CatalogProduct = {
  id: number;
  name: string;
  shortDescription: string;
  /** Whole currency units. */
  price: number;
  sizes: string[];
  category: string;
};