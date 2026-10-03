"use client";

import { OrderType } from "@repo/types";
import {
  ArrowUpDown,
  CreditCard,
  Search,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

// `paymentMethod` isn't on the shared OrderType yet - see the note in the
// chat reply about adding it to the Order schema in @repo/order-db. This
// local extension lets the table render it as soon as the field exists on
// the data, without needing that shared package updated first.
type Order = OrderType & { paymentMethod?: string };

type SortKey = "date" | "amount";
type SortDirection = "asc" | "desc";

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-50 text-green-700",
  successful: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

const StatusBadge = ({ status }: { status: string }) => {
  const style =
    STATUS_STYLES[status.toLowerCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  mobile_money: "Mobile Money",
  bank_card: "Bank Card",
};

const PAYMENT_METHOD_ICONS: Record<string, typeof Wallet> = {
  stripe: Wallet,
  mobile_money: Smartphone,
  bank_card: CreditCard,
};

const PaymentMethodBadge = ({ method }: { method?: string }) => {
  if (!method) return <span className="text-gray-400">-</span>;

  const Icon = PAYMENT_METHOD_ICONS[method] ?? Wallet;
  const label = PAYMENT_METHOD_LABELS[method] ?? method;

  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      {label}
    </span>
  );
};

const formatAmount = (amount: number) =>
  `UGX ${amount.toLocaleString("en-UG")}`;

const formatDate = (date: string | Date | undefined) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const OrdersTable = ({ orders }: { orders: Order[] }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const statusOptions = useMemo(() => {
    const seen = new Set(orders.map((o) => o.status).filter(Boolean));
    return ["all", ...Array.from(seen)];
  }, [orders]);

  const methodOptions = useMemo(() => {
    const seen = new Set(orders.map((o) => o.paymentMethod).filter(Boolean));
    return ["all", ...Array.from(seen)] as string[];
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesMethod =
        methodFilter === "all" || order.paymentMethod === methodFilter;

      if (!matchesStatus || !matchesMethod) return false;
      if (!query) return true;

      const productNames =
        order.products
          ?.map((p) => p.name)
          .join(" ")
          .toLowerCase() ?? "";

      return (
        order._id.toLowerCase().includes(query) || productNames.includes(query)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "amount") {
        return (a.amount - b.amount) * direction;
      }

      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (aDate - bDate) * direction;
    });

    return sorted;
  }, [orders, search, statusFilter, methodFilter, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const SortableHeader = ({
    label,
    sortableKey,
  }: {
    label: string;
    sortableKey: SortKey;
  }) => (
    <button
      type="button"
      onClick={() => toggleSort(sortableKey)}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
    >
      {label}
      <ArrowUpDown
        className={`w-3 h-3 ${sortKey === sortableKey ? "text-gray-800" : "text-gray-300"}`}
      />
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or product"
            className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {statusOptions.length > 1 && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
        )}

        {methodOptions.length > 1 && (
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method === "all"
                  ? "All payment methods"
                  : (PAYMENT_METHOD_LABELS[method] ?? method)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* TABLE */}
      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-700">
            {orders.length === 0
              ? "No orders yet"
              : "No orders match your search"}
          </p>
          <p className="text-xs text-gray-500">
            {orders.length === 0
              ? "Orders you place will show up here."
              : "Try a different search term or status."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <SortableHeader label="Date" sortableKey="date" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Products
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left">
                  <SortableHeader label="Amount" sortableKey="amount" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => {
                const products = order.products ?? [];
                const firstProducts = products.slice(0, 2);
                const remaining = products.length - firstProducts.length;

                return (
                  <tr
                    key={order._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {order._id.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {firstProducts.length > 0
                        ? `${firstProducts.map((p) => p.name).join(", ")}${
                            remaining > 0 ? ` +${remaining} more` : ""
                          }`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <PaymentMethodBadge method={order.paymentMethod} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                      {formatAmount(order.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status ?? "unknown"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
