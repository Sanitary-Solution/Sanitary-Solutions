import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signJwt = (payload, options = {}) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: options.expiresIn || env.jwtExpiresIn,
  });

export const verifyJwt = (token) => jwt.verify(token, env.jwtSecret);
