import mongoose, { Schema } from "mongoose";

export type CartItemDoc = {
  productId: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
};

export type CartDoc = {
  userId: string;
  items: CartItemDoc[];
};

const cartItemSchema = new Schema<CartItemDoc>(
  {
    productId: { type: Number, required: true },
    selectedSize: { type: String, required: true },
    selectedColor: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const cartSchema = new Schema<CartDoc>(
  {
    // One cart document per Clerk user. Unique + indexed since every
    // read/write looks the cart up by this field.
    userId: { type: String, required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

// Reuse the compiled model across hot reloads / multiple imports instead
// of calling mongoose.model() twice, which throws "OverwriteModelError".
export const Cart =
  (mongoose.models.Cart as mongoose.Model<CartDoc>) ||
  mongoose.model<CartDoc>("Cart", cartSchema);

let connected = false;

export const connectCartDb = async () => {
  if (connected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "cart",
  });

  connected = true;
  console.log("cart-db connected");
};