export const CHECKOUT_STEPS = [
  { id: 1, title: "Cart", href: "/cart" },
  { id: 2, title: "Shipping", href: "/cart/shipping" },
  { id: 3, title: "Payment", href: "/cart/payment" },
] as const;

export const getActiveStep = (pathname: string) =>
  pathname.startsWith("/cart/payment")
    ? 3
    : pathname.startsWith("/cart/shipping")
      ? 2
      : 1;

export const formatUGX = (amount: number) =>
  `UGX ${amount.toLocaleString("en-US")}`;
