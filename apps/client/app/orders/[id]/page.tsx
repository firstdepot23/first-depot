import { auth } from "@clerk/nextjs/server";
import type { OrderType } from "@repo/types";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import RetryButton from "../../components/RetryButton";
import {
  formatDateTime,
  formatMoney,
  getShippingStep,
  isActivePending,
  isPaidOrder,
  shippingCopy,
  stepPosition,
  stepsFor,
  type ShippingStep,
} from "../../lib/order";

type FetchResult =
  { ok: true; order: OrderType } | { ok: false; message: string };

const fetchOrder = async (id: string): Promise<FetchResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace(
    /\/+$/,
    "",
  );
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_ORDER_SERVICE_URL is not set");
    return { ok: false, message: "The orders service isn't configured." };
  }

  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    return { ok: false, message: "Please sign in to see your order." };
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/user-orders/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Couldn't reach the order service:", error);
    return {
      ok: false,
      message:
        "Couldn't reach the orders service. It may be waking up - try again in a few seconds.",
    };
  }

  // Not found, or not this customer's order: same answer for both.
  if (res.status === 404) notFound();

  if (!res.ok) {
    console.error(`Failed to fetch order ${id}: ${res.status}`);
    return {
      ok: false,
      message:
        res.status === 401
          ? "We couldn't verify your sign-in. Try signing out and back in."
          : "We couldn't load this order right now.",
    };
  }

  return { ok: true, order: (await res.json()) as OrderType };
};

const titleCase = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

// When the order reached `step` (the latest time it was set to it).
const reachedAt = (order: OrderType, step: ShippingStep) => {
  const history = (order.shippingHistory ?? []) as {
    status: string;
    changedAt: string | Date;
  }[];
  return [...history].reverse().find((entry) => entry.status === step)
    ?.changedAt;
};

const Tracker = ({ order }: { order: OrderType }) => {
  const current = getShippingStep(order);
  if (!current) return null;

  const method = order.deliveryMethod;
  const city = titleCase(order.deliveryCity ?? order.shipping?.city);
  const steps = stepsFor(method);
  const position = stepPosition(steps, current);
  const finished = current === "delivered";
  const currentCopy = shippingCopy(current, method, city);

  return (
    <section
      aria-labelledby="tracking-heading"
      className="rounded-lg border border-gray-200 p-4 sm:p-6"
    >
      <h2 id="tracking-heading" className="text-lg font-medium">
        Order status
      </h2>

      <p
        className={`mt-3 rounded-md px-4 py-3 text-sm ${
          finished ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
        }`}
      >
        <span className="font-medium">{currentCopy.label}.</span>{" "}
        {currentCopy.detail}
      </p>

      <ol className="mt-6">
        {steps.map((step, index) => {
          const reached = index <= position;
          const isCurrent = index === position;
          const done = index < position || (isCurrent && finished);
          const isLast = index === steps.length - 1;
          const { label, detail } = shippingCopy(step, method, city);
          const when = reached ? reachedAt(order, step) : null;

          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex gap-3 pb-6 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute bottom-0 left-[15px] top-8 w-0.5 ${
                    index < position ? "bg-green-600" : "bg-gray-200"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium ${
                  done
                    ? "border-green-600 bg-green-600 text-white"
                    : isCurrent
                      ? "border-green-600 bg-white text-green-700 ring-4 ring-green-100"
                      : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <div className="pt-1">
                <p
                  className={`text-sm font-medium ${reached ? "text-gray-900" : "text-gray-400"}`}
                >
                  {label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-sm text-gray-600">{detail}</p>
                )}
                {when && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDateTime(when)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const Detail = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <dt className="text-xs text-gray-500">{label}</dt>
    <dd className="mt-0.5 text-sm text-gray-800">{children}</dd>
  </div>
);

const OrderPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const result = await fetchOrder(id);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-3xl py-6 sm:py-8">
        <div className="flex flex-col items-start gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
          <p>{result.message}</p>
          <RetryButton />
        </div>
      </div>
    );
  }

  const order = result.order;
  const now = Date.now();
  const paid = isPaidOrder(order);
  const products = order.products ?? [];
  const method = order.deliveryMethod;
  const subtotal =
    order.subtotal ??
    products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const deliveryFee = order.deliveryFee ?? Math.max(0, order.amount - subtotal);
  const shipping = order.shipping;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6 sm:py-8">
      <div>
        <Link
          href="/orders"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Your orders
        </Link>
        <h1 className="text-2xl font-medium">Order {order._id.slice(-8)}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Placed {formatDateTime(order.createdAt)}
        </p>
      </div>

      {paid ? (
        <Tracker order={order} />
      ) : (
        <p
          className={`rounded-md px-4 py-3 text-sm ${
            isActivePending(order, now)
              ? "bg-amber-50 text-amber-700"
              : "bg-gray-50 text-gray-700"
          }`}
        >
          {isActivePending(order, now)
            ? "We're confirming your payment. Tracking appears here once it's confirmed."
            : "This order wasn't paid, so it won't be shipped."}
        </p>
      )}

      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="mb-3 text-lg font-medium">
          Items ordered
        </h2>
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {products.map((product, index) => (
            <li
              key={`${product.name}-${index}`}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {product.name}
                </p>
                {(product.selectedSize || product.selectedColor) && (
                  <p className="text-xs text-gray-500">
                    {[product.selectedSize, product.selectedColor]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-gray-500">
                  {product.quantity} ×{" "}
                  {formatMoney(product.price, order.currency)}
                </p>
              </div>
              <p className="whitespace-nowrap text-sm font-medium text-gray-800">
                {formatMoney(product.price * product.quantity, order.currency)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>Subtotal</dt>
            <dd>{formatMoney(subtotal, order.currency)}</dd>
          </div>
          {(method === "delivery" || deliveryFee > 0) && (
            <div className="flex justify-between text-gray-600">
              <dt>Delivery fee</dt>
              <dd>{formatMoney(deliveryFee, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-medium text-gray-900">
            <dt>Total</dt>
            <dd>{formatMoney(order.amount, order.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-medium">
            {method === "pickup" ? "Pickup" : "Delivery"}
          </h2>
          <dl className="space-y-3">
            {method && <Detail label="Method">{titleCase(method)}</Detail>}
            <Detail label={method === "pickup" ? "Collect from" : "Deliver to"}>
              {shipping?.name && <span className="block">{shipping.name}</span>}
              {shipping?.address}
              {shipping?.city && <span className="block">{shipping.city}</span>}
            </Detail>
            {shipping?.phone && <Detail label="Phone">{shipping.phone}</Detail>}
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-medium">Payment</h2>
          <dl className="space-y-3">
            <Detail label="Status">
              {paid
                ? "Paid"
                : titleCase(
                    String(order.paymentStatus ?? order.status).toLowerCase(),
                  )}
            </Detail>
            {order.paymentMethod && (
              <Detail label="Method">
                {order.paymentMethod}
                {order.paymentAccount && (
                  <span className="block font-mono text-xs text-gray-500">
                    {order.paymentAccount}
                  </span>
                )}
              </Detail>
            )}
            {order.paidAt && (
              <Detail label="Paid on">{formatDateTime(order.paidAt)}</Detail>
            )}
            {order.confirmationCode && (
              <Detail label="Confirmation code">
                <span className="font-mono text-xs">
                  {order.confirmationCode}
                </span>
              </Detail>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
};

export default OrderPage;
