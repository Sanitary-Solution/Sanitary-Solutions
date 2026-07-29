import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

let cachedTransporter = null;

const isPlaceholderSmtpHost = (value) => value === "smtp.example.com";

const hasSmtpConfig = () =>
  Boolean(
    env.smtpHost &&
      !isPlaceholderSmtpHost(env.smtpHost) &&
      env.smtpPort &&
      env.smtpUser &&
      env.smtpPass &&
      env.smtpFrom
  );

export const getMailerTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (!hasSmtpConfig()) {
    throw new ApiError(
      500,
      "SMTP credentials are not configured. Replace the placeholder SMTP values in backend/.env with a real mail provider host, username, password, and from address."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getMailerTransporter();
  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html,
  });
};
