import {
  getPesapalTransactionStatus,
  PesapalBillingAddress,
  submitPesapalOrder,
} from "./pesapal";

// Card payments go through Pesapal's hosted payment page (shown in an iframe
// on the client). Card numbers are typed into Pesapal's page, NEVER into our
// site, so card data never touches our frontend or servers.

export type InitiateCardPaymentInput = {
  amount: number; // whole UGX shillings for the entire cart
  reference: string; // our merchant reference for this attempt
  description?: string;
  billingAddress: PesapalBillingAddress;
};

export type CardChargeResult = {
  reference: string; // Pesapal order tracking id
  status: "pending" | "successful" | "failed";
  redirectUrl?: string; // Pesapal hosted payment page - load it in an iframe
};

export const initiateCardPayment = async (
  input: InitiateCardPaymentInput,
): Promise<CardChargeResult> => {
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

export const getCardPaymentStatus = async (
  orderTrackingId: string,
): Promise<CardChargeResult> => {
  const result = await getPesapalTransactionStatus(orderTrackingId);

  const status: CardChargeResult["status"] =
    result.status_code === 1
      ? "successful"
      : result.status_code === 2 || result.status_code === 3
        ? "failed"
        : "pending";

  return { reference: orderTrackingId, status };
};