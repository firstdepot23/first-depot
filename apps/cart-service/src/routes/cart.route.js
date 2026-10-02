import { Router } from "express";
import { getCart, saveCart, clearCart } from "../controller/cart.controller";
import { requireAuth } from "../middleware/requireAuth";
const router = Router();
router.get("/", requireAuth, getCart);
router.put("/", requireAuth, saveCart);
router.delete("/", requireAuth, clearCart);
export default router;
