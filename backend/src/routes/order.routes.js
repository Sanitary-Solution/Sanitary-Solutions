import { Router } from "express";
import {
  createOrder,
  cancelMyOrder,
  deleteOrder,
  getOrderById,
  getMyOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authenticate, authenticateCustomer, authorize } from "../middlewares/auth.js";

const router = Router();

router.post("/", authenticateCustomer, createOrder);
router.get("/my", authenticateCustomer, getMyOrders);
router.get("/my/:id", authenticateCustomer, getMyOrderById);
router.patch("/my/:id/cancel", authenticateCustomer, cancelMyOrder);
router.get("/", authenticate, authorize("admin"), getOrders);
router.get("/:id", authenticate, authorize("admin"), getOrderById);
router.patch("/:id/status", authenticate, authorize("admin"), updateOrderStatus);
router.delete("/:id", authenticate, authorize("admin"), deleteOrder);

export default router;
