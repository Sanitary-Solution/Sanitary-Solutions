import dotenv from "dotenv";

dotenv.config();

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sanitary_solutions",
  jwtSecret: process.env.JWT_SECRET || "replace_with_strong_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: parsePort(process.env.SMTP_PORT, 587),
  smtpSecure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  passwordResetOtpExpiresInMinutes: parsePort(process.env.PASSWORD_RESET_OTP_EXPIRES_IN_MINUTES, 10),
};
