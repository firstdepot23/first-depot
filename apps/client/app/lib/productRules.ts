import type { ProductType } from "@repo/types";

/**
 * Why a product can't be added to the cart. `null` means it can.
 *
 * IMPORTANT: this only controls what the storefront shows. It is NOT a
 * compliance control on its own: anyone can call the cart/order APIs
 * directly. The cart and order services must enforce the same rules (see the
 * notes that came with this change).
 */
export type Unavailable = "prescription" | "out-of-stock" | "expired";

export const isPrescriptionOnly = (product: ProductType) =>
  product.segment === "PHARMACY" && product.prescriptionRequired === true;

export const unavailableReason = (
  product: ProductType,
  now: Date = new Date(),
): Unavailable | null => {
  // Hardware stock isn't tracked yet (it stays at 0), so 0 must not read as
  // "sold out" there. Hardware is always purchasable.
  if (product.segment === "HARDWARE") return null;

  // Treated as expired ON the expiry date, not the day after: the safe
  // choice for medicines. (expiryDate arrives as an ISO string over JSON.)
  if (product.expiryDate && new Date(product.expiryDate) <= now) {
    return "expired";
  }
  if (isPrescriptionOnly(product)) return "prescription";
  if (product.stock <= 0) return "out-of-stock";
  return null;
};