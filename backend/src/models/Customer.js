import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      default: null,
    },
    passwordResetOtpHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
    hasAccount: {
      type: Boolean,
      default: false,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

customerSchema.index({ name: "text", email: "text" });

customerSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  if (!this.password) {
    this.hasAccount = false;
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  this.hasAccount = true;
  return next();
});

customerSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

customerSchema.methods.hasValidPasswordResetOtp = function hasValidPasswordResetOtp(otp) {
  if (!this.passwordResetOtpHash || !this.passwordResetOtpExpiresAt) {
    return false;
  }

  if (this.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    return false;
  }

  return bcrypt.compare(String(otp), this.passwordResetOtpHash);
};

customerSchema.methods.clearPasswordResetOtp = function clearPasswordResetOtp() {
  this.passwordResetOtpHash = null;
  this.passwordResetOtpExpiresAt = null;
};

export const Customer = mongoose.model("Customer", customerSchema);
