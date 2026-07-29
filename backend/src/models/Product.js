import mongoose from "mongoose";

const productSizeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    legacyId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    discountedPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    discountEnabled: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    sizes: {
      type: [productSizeSchema],
      default: [],
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, brand: 1 });

productSchema.pre("validate", function normalizeProduct(next) {
  const normalizedImages = Array.isArray(this.images)
    ? this.images.map((image) => String(image || "").trim()).filter(Boolean)
    : [];
  const primaryImage = String(this.image || "").trim();

  if (normalizedImages.length > 0) {
    this.images = Array.from(new Set([primaryImage, ...normalizedImages].filter(Boolean)));
    this.image = this.images[0];
  } else if (primaryImage) {
    this.images = [primaryImage];
    this.image = primaryImage;
  } else {
    this.images = [];
  }

  const normalizedSizes = Array.isArray(this.sizes)
    ? this.sizes
        .map((size) => ({
          label: String(size?.label || "").trim(),
          price: Number(size?.price ?? 0),
          quantity: Number(size?.quantity ?? 0),
          inStock: Boolean(size?.inStock ?? Number(size?.quantity ?? 0) > 0),
        }))
        .filter((size) => size.label)
    : [];

  this.sizes = normalizedSizes;

  if (normalizedSizes.length > 0) {
    const totalQuantity = normalizedSizes.reduce((sum, size) => sum + Number(size.quantity || 0), 0);
    this.price =
      this.discountEnabled && Number.isFinite(this.discountedPrice)
        ? Number(this.discountedPrice)
        : Number(normalizedSizes[0]?.price ?? this.price ?? 0);
    this.quantity = totalQuantity;
    this.inStock = totalQuantity > 0;
    this.sizes = normalizedSizes.map((size) => ({
      ...size,
      inStock: Number(size.quantity || 0) > 0,
    }));
  } else {
    const normalizedOriginalPrice = this.originalPrice === null ? null : Number(this.originalPrice);
    const normalizedDiscountedPrice =
      this.discountedPrice === null ? null : Number(this.discountedPrice);
    const hasDiscount =
      Boolean(this.discountEnabled) &&
      Number.isFinite(normalizedOriginalPrice) &&
      Number.isFinite(normalizedDiscountedPrice) &&
      normalizedOriginalPrice > normalizedDiscountedPrice;

    if (hasDiscount) {
      this.originalPrice = normalizedOriginalPrice;
      this.discountedPrice = normalizedDiscountedPrice;
      this.price = normalizedDiscountedPrice;
      this.discountEnabled = true;
    } else {
      this.originalPrice = null;
      this.discountedPrice = null;
      this.discountEnabled = false;
      this.price = Number(this.price ?? normalizedOriginalPrice ?? 0);
    }

    this.quantity = Number(this.quantity ?? 0);
    this.inStock = this.quantity > 0 ? Boolean(this.inStock ?? true) : false;
  }

  next();
});

productSchema.methods.getDefaultSize = function getDefaultSize() {
  return Array.isArray(this.sizes) && this.sizes.length > 0 ? this.sizes[0] : null;
};

productSchema.methods.getSizeByLabel = function getSizeByLabel(label) {
  const normalizedLabel = String(label || "").trim().toLowerCase();
  if (!normalizedLabel) {
    return null;
  }

  return (
    this.sizes?.find((size) => String(size.label || "").trim().toLowerCase() === normalizedLabel) ||
    null
  );
};

export const Product = mongoose.model("Product", productSchema);
