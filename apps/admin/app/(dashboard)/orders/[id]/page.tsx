import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FirstDepotLogo } from "../../../components/FirstDepotLogo";
import { Button } from "../../../components/ui/button";
import { OrderApiError, orderFetch, readApiError } from "../order-api";
import { PaymentBadge } from "../order-badges";
import {
  customerName,
  formatDate,
  formatDateTime,
  formatUGX,
  getPaymentStatus,
  getShippingStatus,
  isPaid,
  orderNumber,
  shippingLabel,
  titleCase,
  type AdminOrder,
} from "../order-types";
import { PrintButton } from "./PrintButton";
import { ShippingControl } from "./ShippingControl";

const getOrder = async (id: string): Promise<AdminOrder> => {
  const res = await orderFetch(`/orders/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    throw new OrderApiError(
      await readApiError(res, "Order service responded with an error"),
      res.status,
    );
  }
  return (await res.json()) as AdminOrder;
};

// When printing, show only the order sheet (not the sidebar or controls).
const printStyles = `
@media print {
  body * { visibility: hidden; }
  #order-sheet, #order-sheet * { visibility: visible; }
  #order-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
}
`;

const Detail = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <>
    <dt className="text-neutral-500">{label}</dt>
    <dd className="text-right font-medium">{children}</dd>
  </>
);

const OrderPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const order = await getOrder(id);

  const method = order.deliveryMethod ?? "delivery";
  const shippingStatus = getShippingStatus(order);
  const subtotal =
    order.subtotal ??
    order.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const deliveryFee = order.deliveryFee ?? Math.max(0, order.amount - subtotal);
  const shipping = order.shipping;

  return (
    <div className="space-y-4">
      <style>{printStyles}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All orders
          </Link>
        </Button>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-[820px] space-y-4 print:hidden">
        <ShippingControl
          orderId={order._id}
          deliveryMethod={order.deliveryMethod}
          status={shippingStatus ?? "processing"}
          history={order.shippingHistory ?? []}
          canShip={isPaid(order)}
        />
      </div>

      {/* The sheet stays white in dark mode: it is a document, like the letterhead. */}
      <article
        id="order-sheet"
        className="mx-auto w-full max-w-[820px] overflow-hidden rounded-sm bg-white text-[13.5px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-black/10"
      >
        <div className="h-2 bg-emerald-700" />

        <header className="flex flex-wrap items-start justify-between gap-4 px-8 pt-7">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-md bg-emerald-700 p-2 text-white">
              <FirstDepotLogo className="size-full" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-wide">
                FIRST DEPOT
              </p>
              <p className="text-xs tracking-widest text-neutral-500">
                HARDWARES LIMITED
              </p>
            </div>
          </div>
          <address className="text-right text-xs not-italic leading-relaxed text-neutral-600">
            <b className="text-neutral-900">+256 781 905 753</b> &nbsp; WhatsApp
            +256 777 433 635
            <br />
            support@first-depot.com &nbsp;|&nbsp; first-depot.com
            <br />
            Plot 00, Ojwina Road - Wigweng, Barogole,
            <br />
            Lira City West, Lira City, Uganda
            <br />
            P. O. Box 332500, LIRA
          </address>
        </header>

        <main className="px-8 pb-8 pt-6">
          <div className="border-b-2 border-neutral-900 pb-3">
            <h1 className="text-2xl font-black tracking-wide">SALES ORDER</h1>
            <p className="text-xs tracking-widest text-neutral-500">
              ORDER FROM CUSTOMER
            </p>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {method === "pickup"
                  ? "Customer, pickup at"
                  : "Customer, deliver to"}
              </h2>
              <p className="font-semibold">{customerName(order)}</p>
              <p>
                {shipping?.address}
                {shipping?.city && (
                  <>
                    <br />
                    {shipping.city}
                  </>
                )}
              </p>
              <p className="mt-1 text-neutral-600">
                {shipping?.phone}
                {shipping?.phone && <br />}
                {shipping?.email ?? order.email}
              </p>
            </section>

            <section>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
                Order details
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
                <Detail label="Order no">{orderNumber(order)}</Detail>
                <Detail label="Date">{formatDate(order.createdAt)}</Detail>
                <Detail label="Delivery">
                  {titleCase(method)}
                  {method === "delivery" && order.deliveryCity
                    ? `, ${titleCase(order.deliveryCity)}`
                    : ""}
                </Detail>
                <Detail label="Shipping">
                  {shippingStatus
                    ? shippingLabel(shippingStatus, method)
                    : "Not shipped"}
                </Detail>
                <Detail label="Payment">
                  <PaymentBadge order={order} />
                </Detail>
              </dl>
            </section>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-y border-neutral-900 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-600">
                  <th className="w-10 px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Description</th>
                  <th className="px-2 py-2 text-right font-semibold">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold">
                    Unit price (UGX)
                  </th>
                  <th className="px-2 py-2 text-right font-semibold">
                    Amount (UGX)
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((product, index) => (
                  <tr
                    key={product._id ?? index}
                    className="border-b border-neutral-200 align-top"
                  >
                    <td className="px-2 py-2 text-neutral-500">{index + 1}</td>
                    <td className="px-2 py-2">
                      {product.name}
                      {(product.selectedSize || product.selectedColor) && (
                        <span className="block text-xs text-neutral-500">
                          {[product.selectedSize, product.selectedColor]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {product.quantity}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatUGX(product.price)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatUGX(product.price * product.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <table className="ml-auto mt-4 w-full max-w-xs border-collapse">
            <tbody>
              <tr>
                <td className="px-2 py-1 text-neutral-600">Subtotal</td>
                <td className="px-2 py-1 text-right tabular-nums">
                  {formatUGX(subtotal)}
                </td>
              </tr>
              {(deliveryFee > 0 || method === "delivery") && (
                <tr>
                  <td className="px-2 py-1 text-neutral-600">Delivery fee</td>
                  <td className="px-2 py-1 text-right tabular-nums">
                    {formatUGX(deliveryFee)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-neutral-900 text-base font-bold">
                <td className="px-2 py-2">Total (UGX)</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatUGX(order.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="mt-6 rounded-sm border border-neutral-300 bg-neutral-50 p-3">
            <b>Payment:</b>{" "}
            {getPaymentStatus(order) === "COMPLETED"
              ? "Paid"
              : titleCase(getPaymentStatus(order).toLowerCase())}
            {order.paymentMethod && <> by {order.paymentMethod}</>}
            {order.paymentAccount && <> ({order.paymentAccount})</>}
            {order.paidAt && <> on {formatDateTime(order.paidAt)}</>}
            {order.confirmationCode && (
              <>. Confirmation code {order.confirmationCode}</>
            )}
            {order.orderTrackingId && (
              <>. Pesapal tracking ID {order.orderTrackingId}</>
            )}
            .
          </p>

          <div className="mt-12 grid grid-cols-2 gap-10">
            <div className="border-t border-neutral-900 pt-1">
              <b>Dispatched by</b>
              <br />
              <span className="text-neutral-500">First Depot store</span>
            </div>
            <div className="border-t border-neutral-900 pt-1">
              <b>Received by</b>
              <br />
              <span className="text-neutral-500">{customerName(order)}</span>
            </div>
          </div>
        </main>

        <footer className="bg-emerald-700 px-8 py-2 text-center text-xs text-white">
          Building comfort for your home &middot; first-depot.com &middot;
          @firstdepot23
        </footer>
      </article>
    </div>
  );
};

export default OrderPage;
