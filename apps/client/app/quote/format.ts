import { CURRENCY } from "./_config";

const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });

export const formatMoney = (n: number | null | undefined) =>
  n == null ? "—" : `${CURRENCY} ${nf.format(Math.round(n))}`;

export const lineTotal = (qty: number, price: number | null) =>
  price == null ? null : Math.round(qty * price);
