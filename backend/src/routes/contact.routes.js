import { Router } from "express";
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from "../controllers/contact.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = Router();

router.post("/", createContactMessage);
router.get("/", authenticate, authorize("admin"), getContactMessages);
router.patch("/:id/status", authenticate, authorize("admin"), updateContactMessageStatus);
router.delete("/:id", authenticate, authorize("admin"), deleteContactMessage);

export default router;
