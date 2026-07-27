import { Customer } from "../models/Customer.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { signJwt, verifyJwt } from "../utils/auth.js";
import { env } from "../config/env.js";
import { sendEmail } from "../utils/mailer.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const normalizeEmail = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
};

const formatCustomerForClient = (customerDoc) => {
  const customer = customerDoc.toObject ? customerDoc.toObject() : customerDoc;

  return {
    id: customer._id,
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || "",
    address: customer.address || "",
    city: customer.city || "",
    postalCode: customer.postalCode || "",
    hasAccount: Boolean(customer.hasAccount),
    role: "customer",
  };
};

const getResetOtp = () => String(crypto.randomInt(100000, 1000000));

const hashResetOtp = async (otp) => bcrypt.hash(String(otp), 10);

const buildResetEmail = ({ name, otp, minutes }) => ({
  subject: "Sanitary Solutions password reset code",
  text: `Hello ${name || "Customer"},\n\nYour password reset OTP is ${otp}. It expires in ${minutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
  html: `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Password reset request</h2>
      <p>Hello ${name || "Customer"},</p>
      <p>Your one-time password (OTP) for Sanitary Solutions is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0">${otp}</div>
      <p>This code expires in <strong>${minutes} minutes</strong>.</p>
      <p>If you did not request a password reset, please ignore this message.</p>
    </div>
  `,
});

export const signupCustomer = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const email = normalizeEmail(req.body.email);
  const phone = req.body.phone?.trim();
  const password = req.body.password;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "Name, email, phone, and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const address = req.body.address?.trim() || "";
  const city = req.body.city?.trim() || "";
  const postalCode = req.body.postalCode?.trim() || "";

  let customer = await Customer.findOne({ email });

  if (customer && customer.hasAccount) {
    throw new ApiError(409, "An account already exists for this email");
  }

  if (customer) {
    customer.name = name;
    customer.phone = phone;
    customer.address = address;
    customer.city = city;
    customer.postalCode = postalCode;
    customer.password = password;
    await customer.save();
  } else {
    customer = await Customer.create({
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      password,
      hasAccount: true,
      totalOrders: 0,
      totalSpent: 0,
    });
  }

  const token = signJwt({ customerId: customer._id, role: "customer" });

  res.status(201).json(
    new ApiResponse(201, "Customer account created", {
      token,
      user: formatCustomerForClient(customer),
    })
  );
});

export const loginCustomer = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const customer = await Customer.findOne({ email }).select("+password");
  if (!customer || !customer.hasAccount) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValidPassword = await customer.comparePassword(password);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signJwt({ customerId: customer._id, role: "customer" });

  res.status(200).json(
    new ApiResponse(200, "Customer login successful", {
      token,
      user: formatCustomerForClient(customer),
    })
  );
});

export const getCurrentCustomer = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, "Current customer fetched", {
      user: formatCustomerForClient(req.customer),
    })
  );
});

export const updateCurrentCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer._id);
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  const name = req.body.name?.trim();
  const phone = req.body.phone?.trim();

  if (!name || !phone) {
    throw new ApiError(400, "Name and phone are required");
  }

  customer.name = name;
  customer.phone = phone;
  customer.address = req.body.address?.trim() || "";
  customer.city = req.body.city?.trim() || "";
  customer.postalCode = req.body.postalCode?.trim() || "";

  await customer.save();

  res.status(200).json(
    new ApiResponse(200, "Customer profile updated", {
      user: formatCustomerForClient(customer),
    })
  );
});

export const changeCustomerPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const customer = await Customer.findById(req.customer._id).select("+password");
  if (!customer || !customer.hasAccount) {
    throw new ApiError(404, "Customer account not found");
  }

  const isValidPassword = await customer.comparePassword(currentPassword);
  if (!isValidPassword) {
    throw new ApiError(400, "Current password is incorrect");
  }

  customer.password = newPassword;
  await customer.save();

  res.status(200).json(new ApiResponse(200, "Password changed successfully"));
});

export const requestCustomerPasswordReset = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const customer = await Customer.findOne({ email }).select(
    "+password +passwordResetOtpHash +passwordResetOtpExpiresAt"
  );
  if (!customer || !customer.hasAccount) {
    throw new ApiError(404, "Email is not registered");
  }

  const otp = getResetOtp();
  customer.passwordResetOtpHash = await hashResetOtp(otp);
  customer.passwordResetOtpExpiresAt = new Date(
    Date.now() + env.passwordResetOtpExpiresInMinutes * 60 * 1000
  );
  await customer.save();

  await sendEmail({
    to: customer.email,
    ...buildResetEmail({
      name: customer.name,
      otp,
      minutes: env.passwordResetOtpExpiresInMinutes,
    }),
  });

  res.status(200).json(
    new ApiResponse(200, "Password reset OTP sent to registered email", {
      email: customer.email,
    })
  );
});

export const verifyCustomerPasswordResetOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const customer = await Customer.findOne({ email }).select(
    "+passwordResetOtpHash +passwordResetOtpExpiresAt"
  );
  if (!customer || !customer.hasAccount) {
    throw new ApiError(404, "Email is not registered");
  }

  const isValidOtp = await customer.hasValidPasswordResetOtp(otp);
  if (!isValidOtp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const resetToken = signJwt(
    {
      customerId: customer._id,
      email: customer.email,
      purpose: "customer-password-reset",
    },
    { expiresIn: "10m" }
  );

  res.status(200).json(
    new ApiResponse(200, "OTP verified", {
      resetToken,
      email: customer.email,
    })
  );
});

export const resetCustomerPassword = asyncHandler(async (req, res) => {
  const resetToken = String(req.body.resetToken || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Reset token and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  let payload;
  try {
    payload = verifyJwt(resetToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired reset token");
  }

  if (payload?.purpose !== "customer-password-reset" || !payload.customerId || !payload.email) {
    throw new ApiError(401, "Invalid or expired reset token");
  }

  const customer = await Customer.findById(payload.customerId).select(
    "+password +passwordResetOtpHash +passwordResetOtpExpiresAt"
  );
  if (!customer || customer.email !== payload.email || !customer.hasAccount) {
    throw new ApiError(404, "Customer account not found");
  }

  customer.password = newPassword;
  customer.clearPasswordResetOtp();
  await customer.save();

  res.status(200).json(new ApiResponse(200, "Password reset successfully"));
});
