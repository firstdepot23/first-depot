import type Stripe from "stripe";
import { StripeProductType } from "@repo/types";
import stripe from "./stripe";

/**
 * Creates a Stripe product with a default price.
 * Throws on failure so callers can handle/log it properly.
 */
export const createStripeProduct = async (
  item: StripeProductType,
): Promise<Stripe.Product> => {
  return await stripe.products.create({
    id: item.id.toString(),
    name: item.name,
    default_price_data: {
      currency: "ugx",
      // UGX is a special case in Stripe's API: it behaves as a
      // zero-decimal currency in real life (no fractional shillings),
      // but for backwards compatibility Stripe still requires the
      // amount to be provided *100, same as a normal two-decimal
      // currency (to charge 5 UGX, send amount 500). Do NOT remove
      // this multiplication under the assumption UGX is "zero-decimal
      // like JPY" - it isn't treated that way by the API.
      unit_amount: Math.round(item.price * 100),
    },
  });
};

/**
 * Returns the unit amount (in cents) of the product's active price.
 * Throws if the product or its price can't be found, so the caller never
 * ends up with an `undefined` or an error object being used as an amount.
 */
export const getStripeProductPrice = async (
  productId: number | string,
): Promise<number> => {
  const prices = await stripe.prices.list({
    product: productId.toString(),
    active: true,
    limit: 1,
  });

  const amount = prices.data[0]?.unit_amount;

  if (amount == null) {
    throw new Error(`No Stripe price found for product ${productId}`);
  }

  return amount;
};

/**
 * Stripe doesn't allow deleting a product that has prices attached
 * (and every product created above has a default price), so we archive it instead.
 */
export const deleteStripeProduct = async (
  productId: number | string,
): Promise<Stripe.Product> => {
  return await stripe.products.update(productId.toString(), {
    active: false,
  });
};