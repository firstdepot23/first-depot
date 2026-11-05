import { Router } from "express";
import {
  createProduct,
  createProductsBulk,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";
import { shouldBeAdmin } from "../middleware/authMiddleware";

const router: Router = Router();

// Creating product used to be open to anyone; it is admin-only now.
router.post("/", shouldBeAdmin, createProduct);
// One supplier delivery = many grocery / pharmacy products at once.
router.post("/bulk", shouldBeAdmin, createProductsBulk);
router.put("/:id", shouldBeAdmin, updateProduct);
router.delete("/:id", shouldBeAdmin, deleteProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);

export default router;
