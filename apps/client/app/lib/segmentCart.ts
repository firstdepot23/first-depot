import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { CartItemsType } from "@repo/types";
import useCartStore from "../stores/storeCart";
import {
  DEFAULT_SEGMENT,
  fromApiSegment,
  parseSegment,
  SEGMENT_SLUGS,
  type SegmentSlug,
} from "../data/segments";

/*
 * One saved cart per customer, shown as FOUR carts (hardware, grocery,
 * fast food, pharmacy). Nothing changes on the server or in the database: every cart
 * line is the full product (hydrated by the cart service), so it already
 * knows its segment. A "segment cart" is just the lines of one segment.
 *
 * Which cart the cart / shipping / payment pages work on is carried in the
 * URL (?segment=pharmacy), so a refresh or a shared link keeps it, and so it
 * can't jump to another cart when the paid items disappear after payment.
 */

export type CartItem = CartItemsType[number];
export type SegmentGroups = Record<SegmentSlug, CartItem[]>;

export const groupCart = (cart: CartItemsType): SegmentGroups => {
  const groups: SegmentGroups = {
    hardware: [],
    grocery: [],
    fastfood: [],
    pharmacy: [],
  };
  for (const item of cart) groups[fromApiSegment(item.segment)].push(item);
  return groups;
};

/** The segment named in the URL, else the first cart that has items. */
export const pickSegment = (
  groups: SegmentGroups,
  fromUrl: SegmentSlug | undefined,
): SegmentSlug =>
  fromUrl ??
  SEGMENT_SLUGS.find((s) => groups[s].length > 0) ??
  DEFAULT_SEGMENT;

export const countUnits = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const subtotalOf = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

/** "/cart" + "pharmacy" -> "/cart?segment=pharmacy" */
export const withSegment = (path: string, segment: SegmentSlug) =>
  `${path}?segment=${segment}`;

/** All the carts, regrouped only when the cart actually changes. */
export const useCartGroups = (): SegmentGroups => {
  const cart = useCartStore((state) => state.cart);
  return useMemo(() => groupCart(cart), [cart]);
};

/**
 * The cart the current page is working on: its segment and its lines.
 * Needs a <Suspense> boundary above it (it reads the URL); the /cart layout
 * has one.
 *
 * PAYMENT: anything that builds the payment request must use `items` from
 * here, never the whole `state.cart`, or paying one cart would charge every
 * cart.
 */
export const useCheckoutCart = () => {
  const searchParams = useSearchParams();
  const groups = useCartGroups();
  const segment = pickSegment(groups, parseSegment(searchParams?.get("segment")));
  return { segment, items: groups[segment], groups };
};