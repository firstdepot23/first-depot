import CheckoutGuard from "../../components/CheckoutGuard";
import PaymentStep from "../../components/PaymentStep";

export default function PaymentPage() {
  return (
    <CheckoutGuard requires="shipping">
      <PaymentStep />
    </CheckoutGuard>
  );
}
