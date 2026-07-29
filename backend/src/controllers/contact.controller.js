import { ContactMessage } from "../models/ContactMessage.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getPagination } from "../utils/pagination.js";

export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    throw new ApiError(400, "Name, email, and message are required");
  }

  const contactMessage = await ContactMessage.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || "",
    message: message.trim(),
    status: "new",
  });

  res.status(201).json(new ApiResponse(201, "Message sent successfully", contactMessage));
});

export const getContactMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status && req.query.status !== "all") {
    filter.status = req.query.status;
  }

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Contact messages fetched", messages, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    })
  );
});

export const updateContactMessageStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["new", "in_progress", "resolved"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid message status");
  }

  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  res.status(200).json(new ApiResponse(200, "Message status updated", message));
});

export const deleteContactMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  await message.deleteOne();

  res.status(200).json(new ApiResponse(200, "Message deleted"));
});
