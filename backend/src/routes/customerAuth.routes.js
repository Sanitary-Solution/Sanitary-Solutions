import { Router } from "express";
import {
  changeCustomerPassword,
  getCurrentCustomer,
  loginCustomer,
  requestCustomerPasswordReset,
  resetCustomerPassword,
  signupCustomer,
  verifyCustomerPasswordResetOtp,
  updateCurrentCustomer,
} from "../controllers/customerAuth.controller.js";
import { authenticateCustomer } from "../middlewares/auth.js";

const router = Router();

router.post("/signup", signupCustomer);
router.post("/login", loginCustomer);
router.post("/forgot-password", requestCustomerPasswordReset);
router.post("/verify-password-reset", verifyCustomerPasswordResetOtp);
router.post("/reset-password", resetCustomerPassword);
router.get("/me", authenticateCustomer, getCurrentCustomer);
router.patch("/me", authenticateCustomer, updateCurrentCustomer);
router.post("/change-password", authenticateCustomer, changeCustomerPassword);

export default router;
