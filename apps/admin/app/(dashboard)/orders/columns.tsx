"use client";

import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import type { DataTableFeatures } from "./data-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { PaymentBadge, ShippingBadge } from "./order-badges";
import {
  customerName,
  formatDate,
  formatMoney,
  orderNumber,
  titleCase,
  type AdminOrder,
} from "./order-types";

export const columns: ColumnDef<DataTableFeatures, AdminOrder>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all orders on this page"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select order"
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    id: "order",
    // Sorts by date; the cell shows the order number.
    accessorFn: (order) => order.createdAt,
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const order = row.original;
      const items = order.products.reduce((sum, p) => sum + p.quantity, 0);
      return (
        <div className="flex flex-col">
          <Link
            href={`/orders/${order._id}`}
            className="font-medium hover:underline"
          >
            {orderNumber(order)}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDate(order.createdAt)} · {items}{" "}
            {items === 1 ? "item" : "items"}
          </span>
        </div>
      );
    },
  },
  {
    id: "customer",
    accessorFn: (order) => customerName(order),
    header: "Customer",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{customerName(order)}</span>
          <span className="text-xs text-muted-foreground">{order.email}</span>
        </div>
      );
    },
  },
  {
    id: "delivery",
    header: "Delivery",
    cell: ({ row }) => {
      const order = row.original;
      if (!order.deliveryMethod) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-col">
          <span>{titleCase(order.deliveryMethod)}</span>
          {order.deliveryMethod === "delivery" && order.deliveryCity && (
            <span className="text-xs text-muted-foreground">
              {titleCase(order.deliveryCity)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => <PaymentBadge order={row.original} />,
  },
  {
    id: "shipping",
    header: "Shipping",
    cell: ({ row }) => <ShippingBadge order={row.original} />,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">
        {formatMoney(row.original.amount)}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order._id}`}>View order</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order._id)}
            >
              Copy order ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/users/${order.userId}`}>View customer</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
