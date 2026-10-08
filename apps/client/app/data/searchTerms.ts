import { categories, type CategoryOption } from "./categoryData";

/*
 * Smart search helpers (no dependencies, safe on server and client).
 *
 *  - "paints" / "Paint " / "PAINT" all become "paint", so plurals match.
 *  - A query that is a category name, slug or common product word
 *    ("bondware", "cement", "concrete", "timber", "pipes"...) resolves to
 *    that category, so the shop shows the whole category.
 */

// Extra words that should land in a category. Keys are category slugs.
// Write them in singular form; plurals are handled automatically.
const ALIASES: Record<string, string[]> = {
  cem: ["cement", "concrete", "mortar", "plaster", "binding", "bond", "cem"],
  tiles: ["tile", "tiling", "grout", "splashback", "floor tile", "wall tile"],
  homeaccessories: ["accessory", "decor", "decoration", "ornament", "home accessory"],
  glass: ["glass", "window", "mirror", "glazing", "clearware"],
  paint: ["paint", "coat", "coating", "varnish", "emulsion", "enamel", "primer", "finish"],
  metal: ["metal", "nail", "screw", "bolt", "fastener", "hardware", "roofing", "iron sheet", "steel"],
  wood: ["wood", "timber", "lumber", "plank"],
  furniture: ["furniture", "chair", "sofa", "bed", "wardrobe"],
  fabric: ["fabric", "curtain", "upholstery", "textile"],
  plumbing: ["plumbing", "pipe", "tap", "valve", "drainage", "tank", "water"],
  safety: ["safety", "helmet", "glove", "protective", "safety boot"],
  tools: ["tool", "drill", "saw", "hammer", "grinder", "power tool", "hand tool"],
  electricals: ["electrical", "electric", "electricity", "cable", "wire", "switch", "socket", "bulb", "lighting", "power"],
  office: ["office", "stationery", "desk"],
};

/** lowercase, strip accents/punctuation, collapse spaces and hyphens. */
export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-\s]+/g, " ")
    .trim();

/** Very small English singulariser: paints -> paint, tiles -> tile, boxes -> box. */
export const singularize = (word: string) => {
  if (word.length <= 3) return word;
  if (/[^aeiou]ies$/.test(word) && word.length > 4) return word.slice(0, -3) + "y";
  if (/(ch|sh|ss|x|z)es$/.test(word)) return word.slice(0, -2);
  if (/(ss|us|is)$/.test(word)) return word;
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
};

/** "Red PAINTS" -> "red paint" */
export const normalizeQuery = (q: string) =>
  normalizeText(q).split(" ").filter(Boolean).map(singularize).join(" ");

// Lookup: normalised phrase -> category, built once.
const lookup = new Map<string, CategoryOption>();
for (const c of categories) {
  if (c.slug === "all") continue;
  const phrases = [c.name, c.slug, ...(ALIASES[c.slug] ?? [])];
  for (const p of phrases) {
    const key = normalizeQuery(p);
    if (key && !lookup.has(key)) lookup.set(key, c);
  }
  // "BondWare" should also match "bond ware" and "bond".
  lookup.set(normalizeQuery(c.name.replace(/ware$/i, "")), c);
}

/** The category a whole query refers to, if any. */
export const resolveCategory = (q: string): CategoryOption | null =>
  lookup.get(normalizeQuery(q)) ?? null;

export type SearchPlan = {
  /** Cleaned text to send as ?search= (empty when a category was resolved). */
  search: string;
  /** Category slug to send as ?category= when the query named a category. */
  category?: string;
  categoryName?: string;
};

/**
 * Turns what the person typed into the filters to send to the product service.
 * `allowCategory` is false when a department chip is already chosen or the
 * text is an exact product name.
 */
export const buildSearchPlan = (q: string, allowCategory = true): SearchPlan => {
  if (allowCategory) {
    const match = resolveCategory(q);
    if (match) {
      return { search: "", category: match.slug, categoryName: match.name };
    }
  }
  return { search: normalizeQuery(q) };
};