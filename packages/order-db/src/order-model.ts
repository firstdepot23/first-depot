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

export const DeliveryMethods = ["pickup", "delivery"] as const;

// Where the parcel is, set by the admin app:
//   processing -> shipped -> at_station -> delivered
// For pickup orders "at_station" means "ready for pickup" and "delivered"
// means "collected". Old orders don't have this field; the admin app shows
// a missing value as "processing".
export const ShippingStatus = [
  "processing",
  "shipped",
  "at_station",
  "delivered",
] as const;
export type ShippingStatusType = (typeof ShippingStatus)[number];

// One entry per change, so the order page can show when each step happened.
const ShippingHistorySchema = new Schema(
  {
    status: { type: String, required: true, enum: ShippingStatus },
    changedAt: { type: Date, required: true },
    changedBy: { type: String }, // Clerk user id of the admin
  },
  { _id: false },
);

// NOTE: no schema `default`s on paymentStatus/status/shippingStatus on purpose. Mongoose
// applies defaults to old documents when it loads them, which would make every
// old successful order look "PENDING". The payment service sets them explicitly.
const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true }, // the customer's account email

    // amount = subtotal + deliveryFee = what Pesapal charges.
    amount: { type: Number, required: true },
    subtotal: { type: Number },
    deliveryFee: { type: Number },
    currency: { type: String }, // Pesapal: currency

    // --- Shipping / delivery (from the shipping step) ---
    deliveryMethod: { type: String, enum: DeliveryMethods },
    deliveryCity: { type: String }, // key of the chosen city, e.g. "gulu" (delivery only)
    shipping: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      address: { type: String }, // for pickup: the station's address
      city: { type: String },
    },

    products: {
      type: [
        {
          name: { type: String, required: true },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
          // Which cart line this was, so the cart can be cleared after payment.
          productId: { type: String },
          selectedSize: { type: String },
          selectedColor: { type: String },
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

    // --- Shipping progress (changed by the admin) ---
    shippingStatus: { type: String, enum: ShippingStatus },
    shippingUpdatedAt: { type: Date },
    shippingHistory: { type: [ShippingHistorySchema] },

    // Set when a payment was still PENDING after its 5 minute session and we
    // marked it FAILED ("cancelled or timed out"). Removed again if Pesapal
    // later reports a real result (e.g. a payment that finished late).
    expiredAt: { type: Date },

    // true once the "order.created" confirmation email event was published.
    confirmationSent: { type: Boolean },
    // false until the customer's cart has been emptied of this order's items.
    // Only new orders have it, so old orders never touch anyone's cart.
    cartCleared: { type: Boolean },
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