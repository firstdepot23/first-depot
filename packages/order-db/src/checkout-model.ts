import mongoose, { model } from "mongoose";
import { DeliveryMethods } from "./order-model";
const { Schema } = mongoose;

// The delivery details a customer entered on the shipping step. One document
// per user, overwritten each time they submit the form. When payment starts,
// the payment service copies these onto the Order, so the order keeps its own
// permanent record even if the customer later changes this draft.
const CheckoutSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    shipping: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
    },
    deliveryMethod: { type: String, required: true, enum: DeliveryMethods },
    deliveryCity: { type: String, required: true }, // validated by the payment service
  },
  { timestamps: true },
);

// Forgotten drafts clean themselves up after 30 days.
CheckoutSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const CheckoutDetails = model("CheckoutDetails", CheckoutSchema);
