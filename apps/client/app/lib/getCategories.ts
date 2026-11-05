import { cache } from "react";
import { categories as hardwareCategories } from "../data/categoryData";
import { toApiSegment, type SegmentSlug } from "../data/segments";

type CategoryOption = { name: string; slug: string };

// Grocery / pharmacy categories live only in the database (hardware's list is
// the static one in categoryData.ts). One request per segment per render;
// a failure just means we fall back to a readable version of the slug.
export const getSegmentCategories = cache(
  async (segment: SegmentSlug): Promise<CategoryOption[]> => {
    const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
    if (!baseUrl) return [];

    try {
      const res = await fetch(
        `${baseUrl}/categories?segment=${toApiSegment(segment)}`,
        { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) return [];
      const data: unknown = await res.json();
      if (!Array.isArray(data)) return [];
      return data
        .filter(
          (c): c is CategoryOption =>
            !!c && typeof c.name === "string" && typeof c.slug === "string",
        )
        .map((c) => ({ name: c.name, slug: c.slug }));
    } catch (error) {
      console.error(`Failed to load ${segment} categories:`, error);
      return [];
    }
  },
);

// "cold-flu" -> "Cold flu"
const prettifySlug = (slug: string) => {
  const text = slug.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getCategoryName = async (
  segment: SegmentSlug,
  slug: string,
): Promise<string> => {
  const list =
    segment === "hardware"
      ? hardwareCategories
      : await getSegmentCategories(segment);
  return list.find((c) => c.slug === slug)?.name ?? prettifySlug(slug);
};