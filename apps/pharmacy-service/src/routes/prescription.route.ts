import { Router } from "express";
import {
  adminQueue,
  createPrescription,
  getImage,
  getOne,
  handleUpload,
  listMine,
  updateStatus,
} from "../controllers/prescription.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router: Router = Router();

// Pharmacist side. Declared first so "admin" is never read as an :id.
router.get("/admin/queue", requireAdmin, adminQueue);
router.patch("/:id/status", requireAdmin, updateStatus);

// Customer side.
router.post("/", requireAuth, handleUpload, createPrescription);
router.get("/", requireAuth, listMine);
router.get("/:id", requireAuth, getOne);
router.get("/:id/images/:index", requireAuth, getImage);

export default router;