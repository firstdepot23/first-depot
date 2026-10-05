import {
  getPesapalTransactionStatus,
  PesapalBillingAddress,
  submitPesapalOrder,
} from "./pesapal";

export type InitiateMobileMoneyPaymentInput = {
  amount: number; 
  reference: string; 
  description?: string;
  billingAddress: PesapalBillingAddress;
};

export type MobileMoneyChargeResult = {
  
  reference: string;
  status: "pending" | "successful" | "failed";
  
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
    case 1: 
      return "successful";
    case 2: 
    case 3: 
      return "failed";
    case 0: 
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