import { Suspense } from "react";
import CartContent from "./CartContent";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center mt-12">
          <p className="text-sm text-gray-500">Loading your cart...</p>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
