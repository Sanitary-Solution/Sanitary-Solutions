import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { formatCode } from "../utils/generateCode.js";
import { getPagination } from "../utils/pagination.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const formatOrderForClient = (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  return {
    id: order.orderNumber,
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customerSnapshot?.name || "",
    email: order.customerSnapshot?.email || "",
    phone: order.customerSnapshot?.phone || "",
    address: order.customerSnapshot?.address || "",
    total: order.total,
    status: order.status,
    items: order.items?.length || 0,
    lineItems: order.items || [],
    date: new Date(order.createdAt).toISOString().split("T")[0],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const findOrder = async (value) => {
  if (isObjectId(value)) {
    return Order.findById(value);
  }
  return Order.findOne({ orderNumber: value });
};

const findCustomerOrder = async (customerId, value) => {
  if (isObjectId(value)) {
    const byId = await Order.findOne({ _id: value, customer: customerId });
    if (byId) {
      return byId;
    }
    return Order.findOne({ orderNumber: value, customer: customerId });
  }
  return Order.findOne({ orderNumber: value, customer: customerId });
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

const buildOrderNumber = async () => {
  const totalOrders = await Order.countDocuments();
  return formatCode("ORD", totalOrders + 1);
};

const getCustomerName = (body) => {
  if (body.name && body.name.trim()) {
    return body.name.trim();
  }
  const firstName = body.firstName?.trim() || "";
  const lastName = body.lastName?.trim() || "";
  return `${firstName} ${lastName}`.trim();
};

export const getOrders = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { orderNumber: regex },
      { "customerSnapshot.name": regex },
      { "customerSnapshot.email": regex },
      { "customerSnapshot.phone": regex },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      "Orders fetched",
      orders.map(formatOrderForClient),
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    )
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json(new ApiResponse(200, "Order fetched", formatOrderForClient(order)));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { customer: req.customer._id };
  if (status && status !== "all") {
    filter.status = status;
  }
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ orderNumber: regex }, { "items.name": regex }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      "Customer orders fetched",
      orders.map(formatOrderForClient),
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    )
  );
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await findCustomerOrder(req.customer._id, req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json(new ApiResponse(200, "Customer order fetched", formatOrderForClient(order)));
});

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.customer?._id) {
    throw new ApiError(401, "Customer authentication is required to place order");
  }

  const { phone, city, postalCode } = req.body;
  const email = req.customer.email;
  const rawAddress = req.body.address?.trim();
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  const customerName = getCustomerName(req.body) || req.customer.name;
  if (!customerName || !phone || !rawAddress) {
    throw new ApiError(400, "Name, phone, and address are required");
  }

  if (items.length === 0) {
    throw new ApiError(400, "Order requires at least one item");
  }

  const normalizedItems = [];
  const productUpdates = [];

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "Each order item requires a valid quantity");
    }

    const candidateId =
      item.productId ||
      item.product?._id ||
      item.product?.legacyId ||
      item.product?.id ||
      item.product ||
      item._id ||
      item.id;

    if (candidateId) {
      const product = await findProductByAnyId(candidateId);
      if (!product) {
        throw new ApiError(404, `Product not found for item ${candidateId}`);
      }

      const requestedSize =
        item.size?.label || item.size?.name || item.size?.size || item.size || item.sizeLabel || "";
      const selectedSize = getProductSize(product, requestedSize);
      if (requestedSize && !selectedSize) {
        throw new ApiError(404, `Size not found for ${product.name}`);
      }
      const availableQuantity = selectedSize ? Number(selectedSize.quantity || 0) : Number(product.quantity || 0);
      const unitPrice = selectedSize ? Number(selectedSize.price || product.price || 0) : Number(product.price || 0);
      const sizeLabel = selectedSize?.label || String(requestedSize || "").trim();

      if (availableQuantity < quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.name}${sizeLabel ? ` (${sizeLabel})` : ""}`
        );
      }

      normalizedItems.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        size: sizeLabel,
        quantity,
      });

      productUpdates.push({ product, quantity, sizeLabel });
      continue;
    }

    if (!item.name || typeof item.price !== "number") {
      throw new ApiError(400, "Item must include product reference or name and price");
    }

    normalizedItems.push({
      name: item.name.trim(),
      price: item.price,
      size: String(item.size || "").trim(),
      quantity,
    });
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderNumber = await buildOrderNumber();
  const formattedAddress = [rawAddress, city, postalCode].filter(Boolean).join(", ");

  const customer = await Customer.findById(req.customer._id);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  customer.name = customerName;
  customer.phone = phone;
  customer.address = rawAddress;
  customer.city = city || "";
  customer.postalCode = postalCode || "";

  customer.totalOrders += 1;
  customer.totalSpent += total;
  await customer.save();

  const order = await Order.create({
    orderNumber,
    customer: customer._id,
    customerSnapshot: {
      name: customerName,
      email,
      phone,
      address: formattedAddress,
    },
    items: normalizedItems,
    total,
    status: "processing",
  });

  for (const { product, quantity, sizeLabel } of productUpdates) {
    if (sizeLabel && Array.isArray(product.sizes) && product.sizes.length > 0) {
      const selectedSize = product.getSizeByLabel ? product.getSizeByLabel(sizeLabel) : null;
      if (selectedSize) {
        selectedSize.quantity = Math.max(0, Number(selectedSize.quantity || 0) - quantity);
        selectedSize.inStock = selectedSize.quantity > 0;
      }
      product.quantity = product.sizes.reduce(
        (sum, size) => sum + Number(size.quantity || 0),
        0
      );
      product.inStock = product.quantity > 0;
    } else {
      product.quantity = Math.max(0, Number(product.quantity || 0) - quantity);
      product.inStock = product.quantity > 0;
    }
    await product.save();
  }

  res.status(201).json(new ApiResponse(201, "Order created", formatOrderForClient(order)));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await findOrder(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;
  await order.save();

  res.status(200).json(new ApiResponse(200, "Order status updated", formatOrderForClient(order)));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const customer = await Customer.findById(order.customer);
  if (customer) {
    customer.totalOrders = Math.max(0, customer.totalOrders - 1);
    customer.totalSpent = Math.max(0, customer.totalSpent - order.total);
    await customer.save();
  }

  await order.deleteOne();

  res.status(200).json(new ApiResponse(200, "Order deleted"));
});
