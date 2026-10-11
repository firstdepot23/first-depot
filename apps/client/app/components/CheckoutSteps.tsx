"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useCartStore from "../stores/storeCart";
import useCheckoutStore from "../stores/storeCheckout";
import { CHECKOUT_STEPS, getActiveStep } from "../lib/checkout";

// Compact on phones (number on top, short label underneath), roomier on
// desktop. Completed steps can be clicked to go back; later steps unlock
// as the earlier ones are done. Link clicks start the NavigationProgress bar.
const CheckoutSteps = () => {
  const pathname = usePathname();
  const activeStep = getActiveStep(pathname);
  const hasItems = useCartStore((state) => state.cart.length > 0);
  const hasShipping = useCheckoutStore((state) => state.shipping !== null);

  const isEnabled = (step: number) => {
    if (step === 1) return true;
    if (!hasItems) return false;
    if (step === 2) return true;
    return hasShipping;
  };

  return (
    <nav aria-label="Checkout steps" className="w-full max-w-2xl">
      <ol className="flex w-full items-start">
        {CHECKOUT_STEPS.map((step, index) => {
          const isActive = step.id === activeStep;
          const isDone = step.id < activeStep;
          const enabled = isEnabled(step.id);

          const circle = (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-white ${
                isActive || isDone ? "bg-gray-800" : "bg-gray-400"
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : step.id}
            </span>
          );
          const label = (
            <span
              className={`text-xs font-medium sm:text-sm ${
                isActive ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {step.title}
            </span>
          );
          const content = (
            <span className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
              {circle}
              {label}
            </span>
          );

          return (
            <li
              key={step.id}
              className={`flex items-start ${index < CHECKOUT_STEPS.length - 1 ? "flex-1" : ""}`}
            >
              {enabled && !isActive ? (
                <Link href={step.href} className="cursor-pointer">
                  {content}
                </Link>
              ) : (
                <span
                  aria-current={isActive ? "step" : undefined}
                  aria-disabled={!enabled}
                  className={enabled ? "" : "cursor-not-allowed opacity-60"}
                >
                  {content}
                </span>
              )}

              {index < CHECKOUT_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-2 mt-4 h-px flex-1 sm:mx-4 ${
                    isDone ? "bg-gray-800" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CheckoutSteps;
