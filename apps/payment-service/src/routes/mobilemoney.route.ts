import { Hono } from "hono";
import { shouldBeUser } from "../middleware/authMiddleware";
import { CartItemsType } from "@repo/types";
import { PendingPayment } from "@repo/order-db";
import { getMobileMoneyStatus, initiateMobileMoneyPayment } from "../utils/mobileMoney";
import clerkClient from "../utils/clerk";

const mobileMoneyRoute = new Hono();

const calculateTotal = (cart: CartItemsType) =>
  cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

mobileMoneyRoute.post("/initiate", shouldBeUser, async (c) => {
  try {
    const userId = c.get("userId");

    const {
      cart,
      phone,
    }: { cart: CartItemsType; phone?: string } = await c.req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return c.json({ error: "Cart is empty" }, 400);
    }

    const user = await clerkClient.users.getUser(userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return c.json(
        { error: "Your account has no email on file - add one before paying." },
        400,
      );
    }

    const amount = calculateTotal(cart);
    const reference = `mm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Remember who is paying and what they bought. The Pesapal IPN only
    // carries the reference, so the webhook reads this back to build the order.
    await PendingPayment.create({
      reference,
      userId,
      email,
      amount,
      products: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    const result = await initiateMobileMoneyPayment({
      amount,
      reference,
      description: `Order ${reference}`,
      billingAddress: {
        email_address: email,
        phone_number: phone || user.phoneNumbers[0]?.phoneNumber,
        first_name: user.firstName ?? undefined,
        last_name: user.lastName ?? undefined,
        country_code: "UG",
      },
    });

    return c.json(result);
  } catch (error) {
    console.error("mobile money initiate failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

mobileMoneyRoute.get("/status/:reference", shouldBeUser, async (c) => {
  try {
    const { reference } = c.req.param();
    const result = await getMobileMoneyStatus(reference);
    return c.json(result);
  } catch (error) {
    console.error("mobile money status check failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

export default mobileMoneyRoute;