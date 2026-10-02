import {
  getPesapalTransactionStatus,
  PesapalBillingAddress,
  submitPesapalOrder,
} from "./pesapal";

export type InitiateMobileMoneyPaymentInput = {
  amount: number; // UGX, whole shillings for the entire cart
  reference: string; // your own reference id for this attempt (merchant_reference)
  description?: string;
  billingAddress: PesapalBillingAddress;
};

export type MobileMoneyChargeResult = {
  // This is Pesapal's order_tracking_id, not your own `reference` above -
  // it's what you poll/verify status with and what mobilemoney.route.ts's
  // /status/:reference expects.
  reference: string;
  status: "pending" | "successful" | "failed";
  // Only present on initiate: send the browser here to complete payment.
  // Pesapal - not us - collects the phone number and drives the MTN/Airtel
  // USSD approval prompt on its own hosted page.
  redirectUrl?: string;
};

export const initiateMobileMoneyPayment = async (
  input: InitiateMobileMoneyPaymentInput,
): Promise<MobileMoneyChargeResult> => {
  const order = await submitPesapalOrder({
    id: input.reference,
    amount: input.amount,
    description: input.description ?? `Order ${input.reference}`,
    billingAddress: input.billingAddress,
  });

  return {
    reference: order.order_tracking_id,
    status: "pending",
    redirectUrl: order.redirect_url,
  };
};

const mapPesapalStatus = (
  statusCode: number,
): MobileMoneyChargeResult["status"] => {
  switch (statusCode) {
    case 1: // COMPLETED
      return "successful";
    case 2: // FAILED
    case 3: // REVERSED
      return "failed";
    case 0: // INVALID
    default:
      return "pending";
  }
};

export const getMobileMoneyStatus = async (
  orderTrackingId: string,
): Promise<MobileMoneyChargeResult> => {
  const result = await getPesapalTransactionStatus(orderTrackingId);

  return {
    reference: orderTrackingId,
    status: mapPesapalStatus(result.status_code),
  };
};