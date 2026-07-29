import mongoose from "mongoose";

const quoteItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    projectType: {
      type: String,
      trim: true,
      default: "",
    },
    productsNeeded: {
      type: String,
      required: true,
      trim: true,
    },
    quoteItems: {
      type: [quoteItemSchema],
      default: [],
    },
    productsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "responded", "converted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

quoteSchema.index({ status: 1, createdAt: -1 });
quoteSchema.index({ email: 1, createdAt: -1 });

export const Quote = mongoose.model("Quote", quoteSchema);
