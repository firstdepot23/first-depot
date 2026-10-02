import { Hono } from "hono";
import { shouldBeUser } from "../middleware/authMiddleware";
import { CartItemsType } from "@repo/types";
import { getCardPaymentStatus, initiateCardPayment } from "../utils/bankCard";

const bankCardRoute = new Hono();

const calculateTotal = (cart: CartItemsType) =>
  cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

bankCardRoute.post("/initiate", shouldBeUser, async (c) => {
  try {
    const {
      cart,
      cardToken,
      cardHolder,
    }: { cart: CartItemsType; cardToken: string; cardHolder: string } =
      await c.req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return c.json({ error: "Cart is empty" }, 400);
    }

    if (!cardToken) {
      return c.json({ error: "Missing card token" }, 400);
    }

    if (!cardHolder) {
      return c.json({ error: "Cardholder name is required" }, 400);
    }

    const amount = calculateTotal(cart);
    const reference = `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result = await initiateCardPayment({
      amount,
      reference,
      cardToken,
      cardHolder,
    });

    return c.json(result);
  } catch (error) {
    console.error("bank card initiate failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

bankCardRoute.get("/status/:reference", shouldBeUser, async (c) => {
  try {
    const { reference } = c.req.param();
    const result = await getCardPaymentStatus(reference);
    return c.json(result);
  } catch (error) {
    console.error("bank card status check failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

export default bankCardRoute;