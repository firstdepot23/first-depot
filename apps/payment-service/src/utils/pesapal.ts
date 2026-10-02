/**
 * Thin client around Pesapal's API 3.0 (https://developer.pesapal.com).
 *
 * Flow this supports, end to end:
 *   1. getAccessToken()      - Pesapal bearer token, cached until it expires.
 *   2. submitPesapalOrder()  - creates an order, returns a redirect_url.
 *                              Send the customer's browser there; Pesapal
 *                              hosts the actual MTN/Airtel Money (or card)
 *                              payment UI, we never touch phone/card entry.
 *   3. Pesapal redirects the customer back to PESAPAL_CALLBACK_URL and
 *      separately calls your registered IPN URL - both carry
 *      OrderTrackingId + OrderMerchantReference as query params.
 *   4. getPesapalTransactionStatus() - call this (from the IPN handler,
 *      and/or the callback page) with that OrderTrackingId to find out
 *      what actually happened. Never trust the callback/IPN params alone
 *      as proof of payment - always re-check status_code against Pesapal.
 *
 * registerPesapalIpn() is a one-off setup helper, not something you call
 * per-payment - see the comment above it.
 */

const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL as string;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY as string;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET as string;
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID as string;
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL as string;

for (const [name, value] of Object.entries({
  PESAPAL_BASE_URL,
  PESAPAL_CONSUMER_KEY,
  PESAPAL_CONSUMER_SECRET,
  PESAPAL_IPN_ID,
  PESAPAL_CALLBACK_URL,
})) {
  if (!value) {
    throw new Error(`Missing ${name} environment variable - see utils/pesapal.ts`);
  }
}

type PesapalError = { error_type: string; code: string; message: string } | null;

type PesapalTokenResponse = {
  token: string;
  expiryDate: string;
  error: PesapalError;
  status: string;
  message: string;
};

// Pesapal tokens are short-lived (a few minutes). Cache in memory and
// re-request a bit before actual expiry rather than on every call - this
// module-level cache is per server process, which is fine for a single
// payment-service instance; if you scale this horizontally you may see
// each instance request its own token, which Pesapal is fine with.
let cachedToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET,
    }),
  });

  // Read as text first, not .json() directly - if Pesapal ever answers
  // with something that isn't valid JSON (an HTML error page from a
  // proxy/WAF, a truncated body, etc.) we want that visible in the error
  // instead of a cryptic "Unexpected token < in JSON" from deep inside
  // res.json().
  const raw = await res.text();
  let data: PesapalTokenResponse;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Pesapal auth returned a non-JSON response (status ${res.status}): ${raw.slice(0, 300)}`,
    );
  }

  if (!res.ok || data.error?.code || data.error?.message || !data.token) {
    // Log the full body server-side (never swallow this into a vague
    // message) since this is exactly the case that previously collapsed
    // into an unhelpful "Pesapal auth failed: OK".
    console.error("Pesapal auth response:", JSON.stringify(data));
    throw new Error(
      `Pesapal auth failed: ${data.error?.message || data.message || JSON.stringify(data)}`,
    );
  }

  // expiryDate is an ISO string. Fall back to a conservative 4 minutes if
  // it's ever missing/unparsable so we don't cache a token forever.
  const parsedExpiry = Date.parse(data.expiryDate);
  const expiresAt = Number.isNaN(parsedExpiry) ? Date.now() + 4 * 60 * 1000 : parsedExpiry;

  cachedToken = { token: data.token, expiresAt };
  return data.token;
};

export type PesapalBillingAddress = {
  email_address: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  country_code?: string; // ISO 3166-1 alpha-2, e.g. "UG"
};

export type SubmitOrderInput = {
  id: string; // your own unique merchant reference for this attempt
  amount: number; // whole UGX shillings - Pesapal takes UGX as a plain decimal amount (unlike Stripe, no *100 here)
  description: string;
  billingAddress: PesapalBillingAddress;
};

export type SubmitOrderResult = {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
};

export const submitPesapalOrder = async (
  input: SubmitOrderInput,
): Promise<SubmitOrderResult> => {
  const token = await getAccessToken();

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: input.id,
      currency: "UGX",
      amount: input.amount,
      description: input.description,
      callback_url: PESAPAL_CALLBACK_URL,
      notification_id: PESAPAL_IPN_ID,
      billing_address: input.billingAddress,
    }),
  });

  const raw = await res.text();
  let data: SubmitOrderResult & { error?: PesapalError };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Pesapal order submission returned a non-JSON response (status ${res.status}): ${raw.slice(0, 300)}`,
    );
  }

  if (!res.ok || !data.order_tracking_id || !data.redirect_url) {
    console.error("Pesapal order submission response:", JSON.stringify(data));
    throw new Error(
      `Pesapal order submission failed: ${data.error?.message || JSON.stringify(data)}`,
    );
  }

  return {
    order_tracking_id: data.order_tracking_id,
    merchant_reference: data.merchant_reference,
    redirect_url: data.redirect_url,
  };
};

export type PesapalTransactionStatus = {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: "INVALID" | "COMPLETED" | "FAILED" | "REVERSED";
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: 0 | 1 | 2 | 3; // 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED
  merchant_reference: string;
  currency: string;
  error: PesapalError;
  status: string;
};

export const getPesapalTransactionStatus = async (
  orderTrackingId: string,
): Promise<PesapalTransactionStatus> => {
  const token = await getAccessToken();

  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    },
  );

  const raw = await res.text();
  let data: PesapalTransactionStatus;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Pesapal status check returned a non-JSON response (status ${res.status}): ${raw.slice(0, 300)}`,
    );
  }

  // Pesapal sometimes populates `error` (e.g. error.message: "Pending
  // Payment", code: "payment_details_not_found") on responses that are
  // still perfectly valid - it just means the transaction hasn't settled
  // yet. status_code being present is what actually tells us we got a
  // real status back; only treat this as a hard failure if that's
  // missing or the HTTP call itself failed.
  if (!res.ok || typeof data.status_code !== "number") {
    console.error("Pesapal status check response:", JSON.stringify(data));
    throw new Error(
      `Pesapal status check failed: ${data.error?.message || JSON.stringify(data)}`,
    );
  }

  return data;
};

/**
 * One-off setup, not a per-payment call. Pesapal requires you to register
 * the URL it should call on payment events before you can reference it as
 * notification_id in an order. You already have PESAPAL_IPN_ID in your
 * .env, which suggests this has been done once already - but double check
 * that the IPN url on file with Pesapal actually points at your deployed
 * /webhooks/pesapal route (see webhooks.route.ts). The IPN_LISTENER_URL in
 * the .env you pasted points at invoicing.pesapal.com, which is Pesapal's
 * own domain, not yours - that looks like a leftover from their docs
 * example rather than a real value, so it's worth re-registering:
 *
 *   import { registerPesapalIpn } from "./utils/pesapal";
 *   const { ipn_id } = await registerPesapalIpn("https://your-domain/webhooks/pesapal");
 *   // then set PESAPAL_IPN_ID to that ipn_id
 */
export const registerPesapalIpn = async (
  url: string,
): Promise<{ ipn_id: string; url: string }> => {
  const token = await getAccessToken();

  const res = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url, ipn_notification_type: "GET" }),
  });

  const data = await res.json();

  if (!res.ok || data.error?.code || data.error?.message) {
    throw new Error(
      `Pesapal IPN registration failed: ${data.error?.message || res.statusText}`,
    );
  }

  return data;
};