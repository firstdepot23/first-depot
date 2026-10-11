import CheckoutGuard from "../../components/CheckoutGuard";
import ShippingForm from "../../components/ShippingForm";

export default function ShippingPage() {
  return (
    <CheckoutGuard requires="cart">
      <ShippingForm />
    </CheckoutGuard>
  );
}
