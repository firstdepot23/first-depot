import type { ReactNode } from "react";
import CheckoutShell from "../components/CheckoutShell";

// Shared by /cart, /cart/shipping and /cart/payment: the title, the step
// indicator, the sign-in / loading states and the order summary stay put
// while only the step itself changes.
export default function CartLayout({ children }: { children: ReactNode }) {
  return <CheckoutShell>{children}</CheckoutShell>;
}
