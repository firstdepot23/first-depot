export type CardChargeResult = {
  reference: string;
  status: "pending" | "successful" | "failed";
};

export type InitiateCardPaymentInput = {
  amount: number; // UGX, whole shillings for the entire cart
  reference: string; // your own reference id for this attempt
  // Opaque token from the gateway's client-side tokenization - see the
  // big comment in BankCardForm.tsx. This must never be a raw card
  // number/CVV; if you find yourself typing `cardNumber` or `cvv` as a
  // field here, stop and wire up the gateway's tokenization SDK instead.
  cardToken: string;
  cardHolder: string;
};

/**
 * *** NOT YET CONFIGURED - this is a scaffold, not a working integration. ***
 *
 * Wire this to whichever Visa/Mastercard-accepting gateway you build
 * against (DPO Group, Network International, Pesapal, and Flutterwave
 * all accept cards in Uganda). Exchange `cardToken` for a real charge
 * via that provider's server-side "charge with token" API and return a
 * reference you can poll/verify.
 *
 * Once you've picked one and have API credentials:
 * 1. Add the credentials as env vars here (e.g. CARD_GATEWAY_API_KEY,
 *    CARD_GATEWAY_SECRET).
 * 2. Replace the body of this function with that provider's charge call.
 * 3. Do the same for getCardPaymentStatus below, or better, have the
 *    gateway call a webhook route here instead of polling - the same
 *    way Stripe's webhook works elsewhere in this project.
 */
export const initiateCardPayment = async (
  input: InitiateCardPaymentInput,
): Promise<CardChargeResult> => {
  throw new Error(
    "Card gateway is not configured yet. See utils/bankCard.ts for setup instructions.",
  );
};

/**
 * *** NOT YET CONFIGURED - see initiateCardPayment above. ***
 */
export const getCardPaymentStatus = async (
  reference: string,
): Promise<CardChargeResult> => {
  throw new Error(
    "Card gateway is not configured yet. See utils/bankCard.ts for setup instructions.",
  );
};