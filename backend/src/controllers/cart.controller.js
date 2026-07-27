import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const normalizeEmail = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
};

const getProductLookupKey = (value) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return { _id: value };
  }
  return { legacyId: String(value) };
};

const getProductSize = (product, requestedSize) => {
  const normalizedLabel = String(requestedSize || "").trim().toLowerCase();

  if (normalizedLabel && product.getSizeByLabel) {
    return product.getSizeByLabel(normalizedLabel);
  }

  if (product.getDefaultSize) {
    return product.getDefaultSize();
  }

  return product.sizes?.[0] || null;
};

const mergeCartItems = (targetItems = [], sourceItems = []) => {
  const map = new Map();

  const push = (item) => {
    const productId = String(item.product);
    const sizeKey = String(item.size || "").trim().toLowerCase();
    const existing = map.get(`${productId}:${sizeKey}`);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(`${productId}:${sizeKey}`, {
        product: item.product,
        snapshot: item.snapshot,
        size: item.size || "",
        quantity: item.quantity,
      });
    }
  };

  targetItems.forEach(push);
  sourceItems.forEach(push);

  return Array.from(map.values());
};

const formatCartForClient = (cartDoc) => {
  const cart = cartDoc.toObject ? cartDoc.toObject() : cartDoc;

  return {
    id: cart._id,
    sessionId: cart.sessionId,
    customerEmail: cart.customerEmail,
    items: (cart.items || []).map((item) => ({
      productId: String(item.product),
      size: item.size || "",
      quantity: item.quantity,
      product: {
        _id: String(item.product),
        id: String(item.product),
        ...item.snapshot,
      },
    })),
    updatedAt: cart.updatedAt,
  };
};

const findCartBySessionId = async (sessionId) => {
  const carts = await Cart.find({ sessionId }).sort({ updatedAt: -1 }).limit(1);
  return carts[0] || null;
};

const findCartByEmail = async (email) => {
  if (!email) return null;
  const carts = await Cart.find({ customerEmail: email }).sort({ updatedAt: -1 }).limit(1);
  return carts[0] || null;
};

const deleteDuplicateCartsForSession = async (sessionId, keepId) => {
  await Cart.deleteMany({ sessionId, _id: { $ne: keepId } });
};

const resolveCart = async ({ sessionId, customerEmail, createIfMissing = true }) => {
  const normalizedEmail = normalizeEmail(customerEmail);
  let sessionCart = await findCartBySessionId(sessionId);

  if (!normalizedEmail) {
    if (!sessionCart && createIfMissing) {
      sessionCart = await Cart.create({ sessionId, items: [] });
    }
    if (sessionCart) {
      await deleteDuplicateCartsForSession(sessionId, sessionCart._id);
    }
    return sessionCart;
  }

  let emailCart = await findCartByEmail(normalizedEmail);

  if (emailCart && sessionCart && String(emailCart._id) !== String(sessionCart._id)) {
    emailCart.items = mergeCartItems(emailCart.items, sessionCart.items);
    emailCart.sessionId = sessionId;
    emailCart.customerEmail = normalizedEmail;
    await emailCart.save();
    await sessionCart.deleteOne();
    sessionCart = emailCart;
  } else if (emailCart) {
    emailCart.sessionId = sessionId;
    emailCart.customerEmail = normalizedEmail;
    await emailCart.save();
    sessionCart = emailCart;
  } else if (sessionCart) {
    sessionCart.customerEmail = normalizedEmail;
    await sessionCart.save();
  } else if (createIfMissing) {
    sessionCart = await Cart.create({
      sessionId,
      customerEmail: normalizedEmail,
      items: [],
    });
  }

  if (sessionCart) {
    await deleteDuplicateCartsForSession(sessionId, sessionCart._id);
  }

  return sessionCart;
};

const validateItemsPayload = (items) => {
  if (!Array.isArray(items)) {
    throw new ApiError(400, "Items must be an array");
  }
};

const normalizeQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : 0;
};

const buildCartItems = async (itemsPayload) => {
  const itemAccumulator = new Map();

  for (const item of itemsPayload) {
    const quantity = normalizeQuantity(item.quantity);
    if (quantity <= 0) {
      continue;
    }

    const candidateId = item.productId || item.product?._id || item.product?.id || item.product;
    const lookup = getProductLookupKey(candidateId);
    if (!lookup) {
      throw new ApiError(400, "Each cart item requires a productId");
    }

    const product = await Product.findOne(lookup);
    if (!product) {
      throw new ApiError(404, `Product not found for cart item ${candidateId}`);
    }

    const requestedSize =
      item.size?.label || item.size?.name || item.size?.size || item.size || item.sizeLabel || "";
    const selectedSize = getProductSize(product, requestedSize);
    if (requestedSize && !selectedSize) {
      throw new ApiError(404, `Size not found for cart item ${candidateId}`);
    }
    const sizeLabel = selectedSize?.label || String(requestedSize || "").trim();
    const unitPrice = selectedSize ? Number(selectedSize.price || product.price || 0) : Number(product.price || 0);
    const availableQuantity = selectedSize ? Number(selectedSize.quantity || 0) : Number(product.quantity || 0);
    const key = `${String(product._id)}:${String(sizeLabel || "").toLowerCase()}`;
    const existing = itemAccumulator.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      itemAccumulator.set(key, {
        product: product._id,
        size: sizeLabel,
        snapshot: {
          name: product.name,
          price: unitPrice,
          size: sizeLabel,
          image: product.image,
          category: product.category,
          brand: product.brand,
          inStock: availableQuantity > 0,
          quantity: availableQuantity,
        },
        quantity,
      });
    }
  }

  return Array.from(itemAccumulator.values());
};

export const getCart = asyncHandler(async (req, res) => {
  const sessionId = req.query.sessionId?.trim();
  const customerEmail = normalizeEmail(req.query.customerEmail);

  if (!sessionId) {
    throw new ApiError(400, "sessionId is required");
  }

  const cart = await resolveCart({ sessionId, customerEmail, createIfMissing: true });

  res.status(200).json(new ApiResponse(200, "Cart fetched", formatCartForClient(cart)));
});

export const saveCart = asyncHandler(async (req, res) => {
  const sessionId = req.body.sessionId?.trim();
  const customerEmail = normalizeEmail(req.body.customerEmail);
  const items = req.body.items ?? [];

  if (!sessionId) {
    throw new ApiError(400, "sessionId is required");
  }

  validateItemsPayload(items);

  const cart = await resolveCart({ sessionId, customerEmail, createIfMissing: true });
  cart.items = await buildCartItems(items);

  if (customerEmail) {
    cart.customerEmail = customerEmail;
  }

  await cart.save();

  res.status(200).json(new ApiResponse(200, "Cart saved", formatCartForClient(cart)));
});

export const clearCart = asyncHandler(async (req, res) => {
  const sessionId = req.body.sessionId?.trim();
  const customerEmail = normalizeEmail(req.body.customerEmail);

  if (!sessionId) {
    throw new ApiError(400, "sessionId is required");
  }

  const cart = await resolveCart({ sessionId, customerEmail, createIfMissing: true });
  cart.items = [];
  await cart.save();

  res.status(200).json(new ApiResponse(200, "Cart cleared", formatCartForClient(cart)));
});
