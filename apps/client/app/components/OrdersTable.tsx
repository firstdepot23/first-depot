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

type SortKey = "date" | "amount";
type SortDirection = "asc" | "desc";

// Pesapal payment statuses (see the order model in @repo/order-db).
type DisplayStatus = "COMPLETED" | "PENDING" | "FAILED" | "REVERSED";

const STATUS_LABELS: Record<DisplayStatus, string> = {
  COMPLETED: "Completed",
  PENDING: "Pending",
  FAILED: "Failed",
  REVERSED: "Reversed",
};

const STATUS_STYLES: Record<DisplayStatus, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
  REVERSED: "bg-gray-100 text-gray-700",
};

const getDisplayStatus = (order: OrderType): DisplayStatus => {
  const status = String(order.paymentStatus ?? "").toUpperCase();
  if (
    status === "COMPLETED" ||
    status === "PENDING" ||
    status === "FAILED" ||
    status === "REVERSED"
  ) {
    return status;
  }

  // Orders saved before Pesapal statuses existed only have the old field.
  if (order.status === "success") return "COMPLETED";
  if (order.status === "failed") return "FAILED";
  return "PENDING";
};

const StatusBadge = ({ status }: { status: DisplayStatus }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
);

// Pesapal returns the method as free text in `payment_method`
// (e.g. "Visa", "MasterCard", "MTN", "Airtel"), so show it as-is and only
// pick an icon from the name.
const getMethodIcon = (method: string) => {
  if (/visa|master|card|amex/i.test(method)) return CreditCard;
  if (/mtn|airtel|mpesa|tigo|mobile|money/i.test(method)) return Smartphone;
  return Wallet;
};

const PaymentMethodBadge = ({
  method,
  account,
}: {
  method?: string | null;
  account?: string | null;
}) => {
  if (!method) return <span className="text-gray-400">-</span>;

  const Icon = getMethodIcon(method);

  return (
    <div className="flex flex-col">
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        {method}
      </span>
      {account && (
        <span className="font-mono text-xs text-gray-400">{account}</span>
      )}
    </div>
  );
};

const formatAmount = (amount: number, currency?: string | null) =>
  `${currency || "UGX"} ${amount.toLocaleString("en-UG")}`;

const formatDate = (date: string | Date | undefined) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const OrdersTable = ({ orders }: { orders: OrderType[] }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const statusOptions = useMemo(() => {
    const seen = new Set<string>(orders.map(getDisplayStatus));
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
        statusFilter === "all" || getDisplayStatus(order) === statusFilter;
      const matchesMethod =
        methodFilter === "all" || order.paymentMethod === methodFilter;

      if (!matchesStatus || !matchesMethod) return false;
      if (!query) return true;

      const productNames =
        order.products
          ?.map((p) => p.name)
          .join(" ")
          .toLowerCase() ?? "";

      const references = [
        order._id,
        order.merchantReference,
        order.orderTrackingId,
        order.confirmationCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return references.includes(query) || productNames.includes(query);
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
                {status === "all"
                  ? "All statuses"
                  : STATUS_LABELS[status as DisplayStatus]}
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
                {method === "all" ? "All payment methods" : method}
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
                      <div>{order._id.slice(-8)}</div>
                      {order.confirmationCode && (
                        <div className="text-gray-400">
                          {order.confirmationCode}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {firstProducts.length > 0
                        ? `${firstProducts.map((p) => p.name).join(", ")}${
                            remaining > 0 ? ` +${remaining} more` : ""
                          }`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <PaymentMethodBadge
                        method={order.paymentMethod}
                        account={order.paymentAccount}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                      {formatAmount(order.amount, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getDisplayStatus(order)} />
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
