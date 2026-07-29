import mongoose from "mongoose";
import { Quote } from "../models/Quote.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { formatCode } from "../utils/generateCode.js";
import { getPagination } from "../utils/pagination.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getQuoteByAnyId = async (value) => {
  if (isObjectId(value)) {
    const quote = await Quote.findById(value);
    if (quote) {
      return quote;
    }
  }
  return Quote.findOne({ quoteNumber: value });
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

const formatQuoteForClient = (quoteDoc) => {
  const quote = quoteDoc.toObject ? quoteDoc.toObject() : quoteDoc;
  const estimatedTotal = Number((quote.productsCount * 165).toFixed(2));
  return {
    id: quote.quoteNumber,
    _id: quote._id,
    quoteNumber: quote.quoteNumber,
    name: quote.name,
    email: quote.email,
    phone: quote.phone,
    projectType: quote.projectType,
    productsNeeded: quote.productsNeeded,
    quoteItems: (quote.quoteItems || []).map((item) => ({
      productId: item.product ? String(item.product) : null,
      productName: item.productName,
      brand: item.brand || "",
      size: item.size || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    products: quote.productsCount,
    total: quote.total || estimatedTotal,
    status: quote.status,
    date: new Date(quote.createdAt).toISOString().split("T")[0],
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
};

const estimateProductsCount = (rawProductsNeeded = "") => {
  if (!rawProductsNeeded) {
    return 0;
  }
  const byLines = rawProductsNeeded
    .split(/\n|,/)
    .map((part) => part.trim())
    .filter(Boolean).length;
  return byLines;
};

const normalizeQuoteItems = async (quoteItemsPayload) => {
  if (!Array.isArray(quoteItemsPayload)) {
    return [];
  }

  const normalizedItems = [];

  for (const item of quoteItemsPayload) {
    const quantity = Number.parseInt(item.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1) {
      continue;
    }

    const candidateId =
      item.productId ||
      item.product?._id ||
      item.product?.legacyId ||
      item.product?.id ||
      item.product;

    let product = null;
    if (candidateId) {
      product = await findProductByAnyId(candidateId);
      if (!product) {
        throw new ApiError(404, `Product not found for quote item ${candidateId}`);
      }
    }

    const productName = item.productName?.trim() || product?.name;
    if (!productName) {
      throw new ApiError(400, "Each quote item requires product name");
    }

    const brand = item.brand?.trim() || product?.brand || "";
    const size = String(item.size || item.variant || item.variantLabel || "").trim();
    const parsedUnitPrice = Number(item.unitPrice);
    const unitPrice =
      Number.isFinite(parsedUnitPrice) && parsedUnitPrice >= 0
        ? parsedUnitPrice
        : Number(product?.price || 0);

    normalizedItems.push({
      product: product?._id,
      productName,
      brand,
      size,
      quantity,
      unitPrice,
      lineTotal: Number((unitPrice * quantity).toFixed(2)),
    });
  }

  return normalizedItems;
};

const summarizeQuoteItems = (items = []) =>
  items
    .map((item) => {
      const sizePart = item.size ? ` · Variant: ${item.size}` : "";
      const brandPart = item.brand ? ` (${item.brand})` : "";
      return `${item.productName}${sizePart}${brandPart} x ${item.quantity}`;
    })
    .join(", ");

const buildQuoteNumber = async () => {
  const totalQuotes = await Quote.countDocuments();
  return formatCode("QT", totalQuotes + 1);
};

export const getQuotes = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ quoteNumber: regex }, { name: regex }, { email: regex }, { phone: regex }];
  }

  const [quotes, total] = await Promise.all([
    Quote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Quote.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      "Quotes fetched",
      quotes.map(formatQuoteForClient),
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    )
  );
});

export const getQuoteById = asyncHandler(async (req, res) => {
  const quote = await getQuoteByAnyId(req.params.id);
  if (!quote) {
    throw new ApiError(404, "Quote not found");
  }

  res.status(200).json(new ApiResponse(200, "Quote fetched", formatQuoteForClient(quote)));
});

export const createQuote = asyncHandler(async (req, res) => {
  const { name, email, phone, projectType } = req.body;
  const rawProductsNeeded = req.body.productsNeeded?.trim() || "";
  const quoteItems = await normalizeQuoteItems(req.body.quoteItems);
  const productsNeeded = quoteItems.length > 0 ? summarizeQuoteItems(quoteItems) : rawProductsNeeded;

  if (!name || !email || !phone || (!productsNeeded && quoteItems.length === 0)) {
    throw new ApiError(400, "Name, email, phone, and selected products are required");
  }

  const parsedTotal = Number(req.body.total);
  const itemsCountFromQuoteItems = quoteItems.reduce((sum, item) => sum + item.quantity, 0);
  const productsCount =
    Number.isInteger(req.body.productsCount) && req.body.productsCount >= 0
      ? req.body.productsCount
      : quoteItems.length > 0
      ? itemsCountFromQuoteItems
      : estimateProductsCount(productsNeeded);

  const totalFromQuoteItems = quoteItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const computedTotal =
    quoteItems.length > 0 ? totalFromQuoteItems : Number((productsCount * 165).toFixed(2));

  const quote = await Quote.create({
    quoteNumber: await buildQuoteNumber(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    projectType: projectType?.trim() || "",
    productsNeeded: productsNeeded.trim(),
    quoteItems,
    productsCount,
    total:
      Number.isFinite(parsedTotal) && parsedTotal >= 0
        ? parsedTotal
        : computedTotal,
    status: "pending",
  });

  res.status(201).json(new ApiResponse(201, "Quote request created", formatQuoteForClient(quote)));
});

export const getMyQuotes = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { email: req.customer.email };
  if (status && status !== "all") {
    filter.status = status;
  }
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { quoteNumber: regex },
      { projectType: regex },
      { productsNeeded: regex },
      { "quoteItems.productName": regex },
    ];
  }

  const [quotes, total] = await Promise.all([
    Quote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Quote.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      "Customer quotes fetched",
      quotes.map(formatQuoteForClient),
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    )
  );
});

export const updateQuoteStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "responded", "converted", "rejected"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid quote status");
  }

  const quote = await getQuoteByAnyId(req.params.id);
  if (!quote) {
    throw new ApiError(404, "Quote not found");
  }

  quote.status = status;
  await quote.save();

  res.status(200).json(new ApiResponse(200, "Quote status updated", formatQuoteForClient(quote)));
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await getQuoteByAnyId(req.params.id);
  if (!quote) {
    throw new ApiError(404, "Quote not found");
  }

  await quote.deleteOne();

  res.status(200).json(new ApiResponse(200, "Quote deleted"));
});
