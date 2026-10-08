import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

// Saved when a payment is initiated, looked up when the Pesapal IPN arrives.
// Pesapal only tells us WHICH transaction changed, so we must remember who
// paid and what they bought ourselves.
const PendingPaymentSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true }, // our merchant reference
    userId: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    products: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    processed: { type: Boolean, default: false }, // true once a successful order was published
    failureRecorded: { type: Boolean, default: false }, // true once a failed order was published
    trackingId: { type: String }, // Pesapal order tracking id
  },
  { timestamps: true },
);

// Abandoned checkouts clean themselves up after 7 days.
PendingPaymentSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 },
);

export const PendingPayment = model("PendingPayment", PendingPaymentSchema);