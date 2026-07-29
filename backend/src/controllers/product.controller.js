import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Brand } from "../models/Brand.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getPagination } from "../utils/pagination.js";

const SORT_MAP = {
  featured: { createdAt: -1 },
  "price-low": { price: 1 },
  "price-high": { price: -1 },
  rating: { rating: -1 },
  name: { name: 1 },
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDiscount = (payload = {}) => {
  const discountEnabled = Boolean(payload.discountEnabled);
  if (!discountEnabled) {
    return {
      discountEnabled: false,
      originalPrice: null,
      discountedPrice: null,
    };
  }

  const originalPrice = Number(payload.originalPrice);
  const discountedPrice = Number(payload.discountedPrice);

  if (!Number.isFinite(originalPrice) || !Number.isFinite(discountedPrice)) {
    throw new ApiError(400, "Original price and discounted price are required when discount is enabled");
  }

  if (originalPrice <= discountedPrice) {
    throw new ApiError(400, "Discounted price must be lower than original price");
  }

  return {
    discountEnabled: true,
    originalPrice,
    discountedPrice,
  };
};

const normalizeImageList = (productImage, images) => {
  const normalizedImages = Array.isArray(images)
    ? images.map((image) => String(image || "").trim()).filter(Boolean)
    : [];
  const primaryImage = String(productImage || "").trim();

  if (normalizedImages.length > 0) {
    return Array.from(new Set([primaryImage, ...normalizedImages].filter(Boolean)));
  }

  return primaryImage ? [primaryImage] : [];
};

const normalizeSizes = (sizes) => {
  if (!Array.isArray(sizes)) {
    return [];
  }

  return sizes
    .map((size) => ({
      label: String(size?.label || "").trim(),
      price: parseNumber(size?.price),
      quantity: Math.max(0, parseInt(size?.quantity, 10) || 0),
    }))
    .filter((size) => size.label)
    .map((size) => ({
      ...size,
      inStock: size.quantity > 0,
    }));
};

const deriveProductValues = (payload = {}) => {
  const sizes = normalizeSizes(payload.sizes);
  const images = normalizeImageList(payload.image, payload.images);
  const hasSizes = sizes.length > 0;
  const basePrice = parseNumber(payload.price);
  const baseQuantity = Math.max(0, parseInt(payload.quantity, 10) || 0);
  const discount = normalizeDiscount(payload);
  const totalQuantity = hasSizes
    ? sizes.reduce((sum, size) => sum + Number(size.quantity || 0), 0)
    : baseQuantity;

  return {
    ...payload,
    image: images[0] || String(payload.image || "").trim(),
    images,
    sizes,
    price: discount.discountEnabled
      ? discount.discountedPrice
      : hasSizes
      ? Number(sizes[0]?.price ?? basePrice)
      : basePrice,
    originalPrice: discount.originalPrice,
    discountedPrice: discount.discountedPrice,
    discountEnabled: discount.discountEnabled,
    quantity: totalQuantity,
    inStock: hasSizes ? totalQuantity > 0 : Boolean(payload.inStock ?? baseQuantity > 0),
  };
};

const getProductSize = (product, sizeLabel) => {
  const normalizedLabel = String(sizeLabel || "").trim().toLowerCase();
  if (!normalizedLabel) {
    return product.getDefaultSize ? product.getDefaultSize() : product.sizes?.[0] || null;
  }

  return product.getSizeByLabel ? product.getSizeByLabel(normalizedLabel) : null;
};

const findProductByAnyId = async (value) => {
  if (isObjectId(value)) {
    const product = await Product.findById(value);
    if (product) {
      return product;
    }
  }
  return Product.findOne({ legacyId: String(value) });
};

const ensureCategoryAndBrandExist = async ({ category, brand }) => {
  if (category?.trim()) {
    await Category.findOneAndUpdate(
      { name: category.trim() },
      { $setOnInsert: { name: category.trim(), description: "Seasonal focus" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (brand?.trim()) {
    await Brand.findOneAndUpdate(
      { name: brand.trim() },
      { $setOnInsert: { name: brand.trim(), description: "Supplier in good standing" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const buildProductFilter = (query) => {
  const filter = {};

  if (query.search) {
    const regex = new RegExp(query.search.trim(), "i");
    filter.$or = [{ name: regex }, { description: regex }, { brand: regex }];
  }

  if (query.category && query.category !== "All") {
    filter.category = query.category;
  }

  if (query.brand && query.brand !== "All") {
    filter.brand = query.brand;
  }

  if (query.inStock === "true") {
    filter.inStock = true;
  }

  if (query.inStock === "false") {
    filter.inStock = false;
  }

  const minPrice = Number.parseFloat(query.minPrice);
  const maxPrice = Number.parseFloat(query.maxPrice);
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filter.price = {};
    if (!Number.isNaN(minPrice)) {
      filter.price.$gte = minPrice;
    }
    if (!Number.isNaN(maxPrice)) {
      filter.price.$lte = maxPrice;
    }
  }

  return filter;
};

export const getProducts = asyncHandler(async (req, res) => {
  const filter = buildProductFilter(req.query);
  const sortBy = SORT_MAP[req.query.sortBy] || SORT_MAP.featured;
  const { page, limit, skip } = getPagination(req.query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortBy).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, "Products fetched", products, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      })
    );
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await findProductByAnyId(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json(new ApiResponse(200, "Product fetched", product));
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = deriveProductValues(req.body);
  await ensureCategoryAndBrandExist(payload);
  const product = await Product.create(payload);
  res.status(201).json(new ApiResponse(201, "Product created", product));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await findProductByAnyId(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  Object.assign(product, deriveProductValues(req.body));
  await ensureCategoryAndBrandExist(req.body);
  await product.save();

  res.status(200).json(new ApiResponse(200, "Product updated", product));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findProductByAnyId(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await product.deleteOne();

  res.status(200).json(new ApiResponse(200, "Product deleted"));
});

export const getProductMeta = asyncHandler(async (req, res) => {
  const [categories, brands] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Brand.find().sort({ name: 1 }),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Product metadata fetched", {
      categories: ["All", ...categories.map((category) => category.name)],
      brands: ["All", ...brands.map((brand) => brand.name)],
    })
  );
});
