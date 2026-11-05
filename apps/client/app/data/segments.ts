/*
 * Storefront segments.
 *
 * URLs use lowercase slugs (/products?segment=grocery, the same ones the
 * SecondaryNavbar already links to); the product service and database use the
 * uppercase enum (HARDWARE | GROCERY | FASTFOOD | PHARMACY). Everything that crosses
 * that line goes through the helpers below, so nobody hand-writes either
 * form in a component.
 */

export type SegmentSlug = "hardware" | "grocery" | "fastfood" | "pharmacy";
export type ApiSegment = "HARDWARE" | "GROCERY" | "FASTFOOD" | "PHARMACY";

/** The homepage, and any old link with no segment, is hardware. */
export const DEFAULT_SEGMENT: SegmentSlug = "hardware";

/** Storefront display order. Hardware first: it is the main shop. */
export const SEGMENT_SLUGS: SegmentSlug[] = [
  "hardware",
  "grocery",
  "fastfood",
  "pharmacy",
];

/**
 * Sections shown on /products when no segment is chosen ("all products").
 * Each one gets its own block; they are never merged into one list.
 *
 * Pharmacy is deliberately excluded: it has its own dedicated search and
 * browsing on its own page, so it should never surface in the general
 * "every section" results - whether that's the navbar search bar's live
 * suggestions (see SEARCHABLE_SEGMENTS in SearchBar.tsx) or this combined
 * /products view.
 */
export const ALL_VIEW_SEGMENTS: SegmentSlug[] = SEGMENT_SLUGS.filter(
  (s) => s !== "pharmacy",
);

export const SEGMENT_META: Record<
  SegmentSlug,
  { label: string; title: string; subtitle: string }
> = {
  hardware: {
    label: "Hardware",
    title: "Hardware",
    subtitle: "Building materials, tools, plumbing and electricals.",
  },
  grocery: {
    label: "Grocery",
    title: "Grocery",
    subtitle: "Food, drinks and household essentials.",
  },
  fastfood: {
    label: "Fast Food",
    title: "Fast Food",
    subtitle: "Hot meals, combos and drinks, made to order.",
  },
  pharmacy: {
    label: "Pharmacy",
    title: "Pharmacy",
    subtitle: "Health, wellness and care products.",
  },
};

/**
 * "Powered by ..." line shown next to a section's title on the products page.
 * Delete a section's entry to hide the line for that section only.
 */
export const SEGMENT_POWERED_BY: Partial<Record<SegmentSlug, string>> = {
  hardware: "First Depot Hardwares Limited",
  grocery: "MD Clove",
  pharmacy: "OxPharm Health Limited",
  fastfood: "MD Clove"
};

/**
 * Accepts "Grocery", "GROCERY", ["grocery"] ... returns undefined if unknown.
 * "fast food", "fast-food" and "FAST_FOOD" all mean the fastfood section.
 */
export const parseSegment = (value: unknown): SegmentSlug | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const slug = raw.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return SEGMENT_SLUGS.find((s) => s === slug);
};

export const toApiSegment = (segment: SegmentSlug): ApiSegment =>
  segment.toUpperCase() as ApiSegment;

/** For `product.segment` (the API value) -> URL slug. */
export const fromApiSegment = (segment: string | null | undefined) =>
  parseSegment(segment) ?? DEFAULT_SEGMENT;