import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    snapshot: {
      name: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      size: { type: String, trim: true, default: "" },
      image: { type: String, required: true, trim: true },
      category: { type: String, required: true, trim: true },
      brand: { type: String, required: true, trim: true },
      inStock: { type: Boolean, default: true },
      quantity: { type: Number, min: 0, default: 0 },
    },
    size: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: null,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

cartSchema.index({ sessionId: 1, updatedAt: -1 });
cartSchema.index({ customerEmail: 1, updatedAt: -1 });

export const Cart = mongoose.model("Cart", cartSchema);
