import { randomBytes } from "node:crypto";
import { connectQuoteDB } from "./connection";
import { Quote, type QuoteEmailStatus, type QuotePlain } from "./quote-model";

export type NewQuote = Omit<
  QuotePlain,
  "reference" | "status" | "emailStatus" | "emailError" | "createdAt" | "updatedAt"
>;

// FD-20261009-K3X9: readable on the phone, hard to guess.
const makeReference = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(4);
  const tail = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `FD-${d}-${tail}`;
};

export const createQuote = async (input: NewQuote): Promise<QuotePlain> => {
  await connectQuoteDB();

  // A reference clash is very unlikely; retry a few times anyway.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const doc = await Quote.create({ ...input, reference: makeReference() });
      return doc.toObject();
    } catch (error) {
      if ((error as { code?: number }).code === 11000 && attempt < 3) continue;
      throw error;
    }
  }
  throw new Error("Could not allocate a quote reference");
};

export const markQuoteEmail = async (
  reference: string,
  emailStatus: QuoteEmailStatus,
  emailError = "",
) => {
  await connectQuoteDB();
  await Quote.updateOne({ reference }, { emailStatus, emailError });
};

export const getQuotes = async (limit = 100): Promise<QuotePlain[]> => {
  await connectQuoteDB();
  return Quote.find().sort({ createdAt: -1 }).limit(limit).lean<QuotePlain[]>();
};
