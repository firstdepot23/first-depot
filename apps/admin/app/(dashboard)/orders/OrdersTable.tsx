"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Sheet, SheetTrigger } from "../../components/ui/sheet";
import AddOrder from "../../components/AddOrder";
import { columns } from "./columns";
import { deleteOrders } from "./action";
import { DataTable } from "./data-table";
import {
  customerName,
  getShippingStatus,
  orderNumber,
  shippingLabel,
  SHIPPING_STATUSES,
  type AdminOrder,
  type ShippingStatusType,
} from "./order-types";

type Filter = "all" | ShippingStatusType;

export const OrdersTable = ({ orders }: { orders: AdminOrder[] }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: orders.length,
      processing: 0,
      shipped: 0,
      at_station: 0,
      delivered: 0,
    };
    for (const order of orders) {
      const status = getShippingStatus(order);
      if (status) result[status] += 1;
    }
    return result;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && getShippingStatus(order) !== filter) return false;
      if (!q) return true;
      return [
        orderNumber(order),
        customerName(order),
        order.email,
        order.shipping?.phone,
        order.deliveryCity,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [orders, query, filter]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    ...SHIPPING_STATUSES.map((status) => ({
      value: status,
      // Pickup wording ("Ready for pickup") only applies per order, so the
      // filters use the delivery labels.
      label: shippingLabel(status),
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, customer, phone or city"
            aria-label="Search orders"
            className="pl-9"
          />
        </div>

        <Sheet open={addOpen} onOpenChange={setAddOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add order
            </Button>
          </SheetTrigger>
          <AddOrder onCreated={() => setAddOpen(false)} />
        </Sheet>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by shipping status"
      >
        {filters.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            <span className="ml-2 tabular-nums opacity-70">
              {counts[item.value]}
            </span>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={visible}
        onRowClick={(order) => router.push(`/orders/${order._id}`)}
        getRowId={(order) => order._id}
        onDeleteSelected={async (ids) => {
          const result = await deleteOrders(ids);
          return result.ok ? { ok: true } : result;
        }}
      />
    </div>
  );
};
