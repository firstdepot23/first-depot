// Shared by the orders list, the single order page and the Add order form.
// The shapes mirror the Order schema in @repo/order-db.

export const SHIPPING_STATUSES = [
  "processing",
  "shipped",
  "at_station",
  "delivered",
] as const;
export type ShippingStatusType = (typeof SHIPPING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
] as const;
export type PaymentStatusType = (typeof PAYMENT_STATUSES)[number];

export const DELIVERY_METHODS = ["pickup", "delivery"] as const;
export type DeliveryMethodType = (typeof DELIVERY_METHODS)[number];

export type AdminOrder = {
  _id: string;
  userId: string;
  email: string;
  amount: number;
  subtotal?: number;
  deliveryFee?: number;
  currency?: string;
  deliveryMethod?: DeliveryMethodType;
  deliveryCity?: string;
  shipping?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  products: {
    _id?: string;
    name: string;
    quantity: number;
    price: number;
    selectedSize?: string;
    selectedColor?: string;
  }[];
  merchantReference?: string;
  orderTrackingId?: string;
  paymentStatus?: PaymentStatusType;
  paymentMethod?: string;
  paymentAccount?: string;
  confirmationCode?: string;
  paidAt?: string;
  status: "success" | "failed" | "pending";
  shippingStatus?: ShippingStatusType;
  shippingUpdatedAt?: string;
  shippingHistory?: {
    status: ShippingStatusType;
    changedAt: string;
    changedBy?: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

// What the Add order form sends to the order service.
export type NewOrderInput = {
  userId: string;
  email: string;
  shipping: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
  };
  deliveryMethod: DeliveryMethodType;
  deliveryCity?: string;
  deliveryFee?: number;
  products: { name: string; quantity: number; price: number }[];
  paymentStatus: PaymentStatusType;
  paymentMethod?: string;
  shippingStatus: ShippingStatusType;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---- helpers ---------------------------------------------------------

// Old orders have no paymentStatus, only the legacy `status`.
export const getPaymentStatus = (order: AdminOrder): PaymentStatusType =>
  order.paymentStatus ??
  (order.status === "success"
    ? "COMPLETED"
    : order.status === "failed"
      ? "FAILED"
      : "PENDING");

export const isPaid = (order: AdminOrder) => order.status === "success";

// Old orders have no shippingStatus; show them as processing so an admin
// can move them along. Unpaid orders have no shipping at all.
export const getShippingStatus = (
  order: AdminOrder,
): ShippingStatusType | null =>
  isPaid(order) ? (order.shippingStatus ?? "processing") : null;

const SHIPPING_LABELS: Record<
  ShippingStatusType,
  Record<DeliveryMethodType, string>
> = {
  processing: { delivery: "Processing", pickup: "Processing" },
  shipped: { delivery: "Shipped", pickup: "Shipped" },
  at_station: { delivery: "At station", pickup: "Ready for pickup" },
  delivered: { delivery: "Delivered", pickup: "Collected" },
};

export const shippingLabel = (
  status: ShippingStatusType,
  method: DeliveryMethodType = "delivery",
) => SHIPPING_LABELS[status][method];

// Pickup orders skip "shipped": the parcel goes straight to the station.
export const shippingSteps = (
  method: DeliveryMethodType = "delivery",
): ShippingStatusType[] =>
  method === "pickup"
    ? ["processing", "at_station", "delivered"]
    : [...SHIPPING_STATUSES];

export const orderNumber = (order: AdminOrder) =>
  order.merchantReference ?? `#${order._id.slice(-6).toUpperCase()}`;

export const customerName = (order: AdminOrder) =>
  order.shipping?.name?.trim() || order.email;

export const titleCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

export const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(amount);

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "";

export const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "";