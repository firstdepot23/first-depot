import mongoose, { InferSchemaType, model } from "mongoose";
const { Schema } = mongoose;

// Pesapal GetTransactionStatus -> status_code:
//   0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED
// An unpaid / not-yet-settled transaction (our starting state, or Pesapal's
// 0 INVALID) is stored as PENDING.
export const PaymentStatus = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
] as const;
export type PaymentStatusType = (typeof PaymentStatus)[number];

// Legacy field, kept in sync with paymentStatus so the admin app and the
// order chart (which read `status`) keep working:
//   COMPLETED -> "success", FAILED/REVERSED -> "failed", PENDING -> "pending"
export const OrderStatus = ["success", "failed", "pending"] as const;

// NOTE: no schema `default`s on paymentStatus/status on purpose. Mongoose
// applies defaults to old documents when it loads them, which would make every
// old successful order look "PENDING". The payment service sets them explicitly.
const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String }, // Pesapal: currency

    products: {
      type: [
        {
          name: { type: String, required: true },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
        },
      ],
      required: true,
    },

    // --- Pesapal identifiers ---
    merchantReference: { type: String, required: true }, // our id, sent as `id` in SubmitOrderRequest
    orderTrackingId: { type: String }, // Pesapal: order_tracking_id

    // --- Pesapal GetTransactionStatus fields ---
    paymentStatus: { type: String, required: true, enum: PaymentStatus },
    statusCode: { type: Number }, // Pesapal: status_code
    paymentMethod: { type: String }, // Pesapal: payment_method (Visa, MasterCard, MTN, Airtel ...)
    paymentAccount: { type: String }, // Pesapal: payment_account (masked card / phone number)
    confirmationCode: { type: String }, // Pesapal: confirmation_code
    statusDescription: { type: String }, // Pesapal: description
    paidAt: { type: Date }, // Pesapal: created_date (set when COMPLETED)

    // Legacy mirror of paymentStatus (see note above).
    status: { type: String, required: true, enum: OrderStatus },

    // true once the "order.created" confirmation email event was published.
    confirmationSent: { type: Boolean },
  },
  { timestamps: true },
);

// Older orders have neither field, so both indexes are sparse.
OrderSchema.index({ merchantReference: 1 }, { unique: true, sparse: true });
OrderSchema.index({ orderTrackingId: 1 }, { unique: true, sparse: true });
OrderSchema.index({ userId: 1, createdAt: -1 });

// Abandoned checkouts (still PENDING after 7 days) clean themselves up.
// Orders that moved on to COMPLETED/FAILED/REVERSED are never deleted.
OrderSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
    partialFilterExpression: { paymentStatus: "PENDING" },
  },
);

export type OrderSchemaType = InferSchemaType<typeof OrderSchema>;

export const Order = model<OrderSchemaType>("Order", OrderSchema);