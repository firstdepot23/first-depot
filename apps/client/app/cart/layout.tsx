import { Suspense, type ReactNode } from "react";
import CheckoutShell from "../components/CheckoutShell";

// Shared by /cart, /cart/shipping and /cart/payment: the title, the step
// indicator, the sign-in / loading states and the order summary stay put
// while only the step itself changes.
//
// The Suspense boundary is required: the steps read which cart they are on
// from the URL (?segment=...) with useSearchParams, and Next.js won't build
// a page that does that without one.
export default function CartLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="mt-12 text-center text-sm text-gray-500">
          Loading your cart...
        </p>
      }
    >
      <CheckoutShell>{children}</CheckoutShell>
    </Suspense>
  );
}
