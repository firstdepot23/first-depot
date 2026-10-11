import { Hono } from "hono";
import { shouldBeUser } from "../middleware/authMiddleware";
import { CartItemsType } from "@repo/types";
import { initiateCardPayment } from "../utils/bankCard";
import { checkPaymentStatus, placeOrder } from "../utils/orders";
import { CheckoutError, prepareCheckout } from "../utils/checkout";
import clerkClient from "../utils/clerk";

const bankCardRoute = new Hono();

// No card details are accepted here. We create a Pesapal order and return
// the URL of Pesapal's hosted payment page; the customer enters their card
// on that page (shown in an iframe).
bankCardRoute.post("/initiate", shouldBeUser, async (c) => {
  try {
    const userId = c.get("userId");
    const { cart }: { cart: CartItemsType } = await c.req.json();

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

    // Delivery details saved on the shipping step + the delivery fee + total,
    // all worked out here on the server.
    const checkout = await prepareCheckout(userId, cart);
    const reference = `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [firstName, ...restName] = checkout.shipping.name.split(" ");

    // Creates the Order as PENDING, then starts the Pesapal payment. The IPN
    // and the status endpoint later fill in Pesapal's result on that Order.
    const result = await placeOrder(
      { userId, email, merchantReference: reference, cart, ...checkout },
      () =>
        initiateCardPayment({
          amount: checkout.amount,
          reference,
          description: `Order ${reference}`,
          billingAddress: {
            email_address: email,
            phone_number:
              checkout.shipping.phone || user.phoneNumbers[0]?.phoneNumber,
            first_name: user.firstName ?? firstName ?? undefined,
            last_name: user.lastName ?? (restName.join(" ") || undefined),
            country_code: "UG",
          },
        }),
    );

    return c.json(result);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return c.json({ error: error.message }, 400);
    }
    console.error("bank card initiate failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

// `reference` = Pesapal tracking id (what /initiate returns) or our
// merchant reference - both work.
bankCardRoute.get("/status/:reference", shouldBeUser, async (c) => {
  try {
    const { reference } = c.req.param();
    const result = await checkPaymentStatus(c.get("userId"), reference);

    if (!result) return c.json({ error: "Payment not found" }, 404);
    return c.json(result);
  } catch (error) {
    console.error("bank card status check failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

export default bankCardRoute;
