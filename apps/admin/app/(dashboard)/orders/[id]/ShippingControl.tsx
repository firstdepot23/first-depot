"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { updateShippingStatus } from "../action";
import {
  formatDateTime,
  shippingLabel,
  shippingSteps,
  type AdminOrder,
  type DeliveryMethodType,
  type ShippingStatusType,
} from "../order-types";

type Props = {
  orderId: string;
  deliveryMethod?: DeliveryMethodType;
  status: ShippingStatusType;
  history: NonNullable<AdminOrder["shippingHistory"]>;
  canShip: boolean;
};

export const ShippingControl = ({
  orderId,
  deliveryMethod = "delivery",
  status,
  history,
  canShip,
}: Props) => {
  const [current, setCurrent] = useState(status);
  const [entries, setEntries] = useState(history);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const steps = shippingSteps(deliveryMethod);
  const currentIndex = steps.indexOf(current);
  const next = steps[currentIndex + 1];

  const change = (target: ShippingStatusType) => {
    if (target === current || isPending || !canShip) return;

    const previous = current;
    setError(null);
    setCurrent(target); // show the change straight away

    startTransition(async () => {
      const result = await updateShippingStatus(orderId, target);
      if (result.ok) {
        setEntries(result.data.shippingHistory ?? []);
      } else {
        setCurrent(previous);
        setError(result.error);
      }
    });
  };

  return (
    <section
      aria-labelledby="shipping-heading"
      className="rounded-lg border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="shipping-heading" className="font-semibold">
            Shipping status
          </h2>
          <p className="text-sm text-muted-foreground">
            {canShip
              ? "Pick a step, or move the order to the next one."
              : "Only paid orders can be shipped."}
          </p>
        </div>
        {canShip && next && (
          <Button onClick={() => change(next)} disabled={isPending}>
            Mark as {shippingLabel(next, deliveryMethod).toLowerCase()}
          </Button>
        )}
      </div>

      <ol className="mt-5 flex items-start">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2",
                    index <= currentIndex ? "bg-emerald-600" : "bg-border",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => change(step)}
                disabled={!canShip || isPending}
                aria-current={active ? "step" : undefined}
                aria-label={shippingLabel(step, deliveryMethod)}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                  done && "border-emerald-600 bg-emerald-600 text-white",
                  active &&
                    "border-emerald-600 bg-background text-emerald-700 ring-4 ring-emerald-600/20",
                  !done &&
                    !active &&
                    "border-border bg-background text-muted-foreground hover:border-emerald-600/60",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </button>
              <span
                className={cn(
                  "mt-2 text-xs sm:text-sm",
                  active ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {shippingLabel(step, deliveryMethod)}
              </span>
            </li>
          );
        })}
      </ol>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-sm text-red-600"
      >
        {error}
      </p>

      <div className="mt-2 border-t pt-3">
        <h3 className="text-sm font-medium">History</h3>
        {entries.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            No changes recorded yet.
          </p>
        ) : (
          <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {[...entries].reverse().map((entry, index) => (
              <li key={`${entry.status}-${entry.changedAt}-${index}`}>
                <span className="font-medium text-foreground">
                  {shippingLabel(entry.status, deliveryMethod)}
                </span>{" "}
                on {formatDateTime(entry.changedAt)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
