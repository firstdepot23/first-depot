// Small pure helpers for the pack-size and accompaniment editors (and the
// bulk-add table). No React in here so they are easy to test.

// Quick-add buttons in the pack editor: the pack sizes groceries usually come in.
export const PACK_PRESETS = [
  "250 g",
  "500 g",
  "1 Kg",
  "2 Kg",
  "5 Kg",
  "10 Kg",
  "25 Kg",
  "50 Kg",
] as const;

// "1 Kg", "1  kg" and "1 KG" are the same pack.
export const normalizeLabel = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, " ");

// The key that decides which bulk-table lines are the same product: same
// category and same name (ignoring case and extra spaces). Empty when either
// is missing, so unfinished lines never group together.
export const bulkGroupKey = (name: string, categorySlug: string) => {
  const n = normalizeLabel(name);
  return n && categorySlug ? `${categorySlug}|${n}` : "";
};

export type PackLike = { label: string; price: number };

// What the product itself shows when it has packs: the lowest price and the
// list of pack labels. Rows that aren't filled in yet are ignored.
export const summarizePacks = (packs: PackLike[]) => {
  const usable = packs.filter((p) => p.label.trim() && p.price >= 1);
  // The first spelling of each size wins ("1 Kg" stays "1 Kg" even if "1  kg"
  // is typed on a later row).
  const seen = new Map<string, string>();
  for (const p of packs) {
    const label = p.label.trim();
    if (label && !seen.has(normalizeLabel(label))) {
      seen.set(normalizeLabel(label), label);
    }
  }
  const labels = [...seen.values()];
  return {
    price: usable.length > 0 ? Math.min(...usable.map((p) => p.price)) : 0,
    sizes: labels,
  };
};

// ---------------------------------------------------------------------
// Pasting a list of accompaniments
// ---------------------------------------------------------------------

export type PastedItem = { name: string; extraPrice: number };

// One item per line. A price is picked up when it is separated from the
// name by a tab, a comma / semicolon, two or more spaces, or a "+":
//   Chips
//   Masala chips, 6500
//   SUBSTITUTE OREO MILKSHAKE   7,000
//   Dynamite sauce +4000
// A number that is part of the name ("Fanta 500") stays in the name.
export const parsePastedItems = (input: string): PastedItem[] => {
  const items: PastedItem[] = [];
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const match = line.match(
      /^(.*?\S)(?:\t+|\s{2,}|\s*[;,]\s*|\s+\+\s*|\s*\+\s*)(\d[\d,]*)$/,
    );
    if (match) {
      const price = Number((match[2] ?? "").replace(/,/g, ""));
      if (Number.isFinite(price)) {
        items.push({ name: (match[1] ?? "").trim(), extraPrice: price });
        continue;
      }
    }
    items.push({ name: line, extraPrice: 0 });
  }
  return items;
};

// ---------------------------------------------------------------------
// Turning react-hook-form's nested error object into readable lines
// ---------------------------------------------------------------------

export type Issue = { path: (string | number)[]; message: string };

// Walks `errors` and lists every message with where it came from, e.g.
// ["variants", 1, "price"] -> "Price must be at least 1".
export const collectIssues = (errors: unknown, base: (string | number)[] = []): Issue[] => {
  const out: Issue[] = [];
  const walk = (node: unknown, path: (string | number)[]) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((child, index) => walk(child, [...path, index]));
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.message === "string" && record.message) {
      out.push({ path, message: record.message });
    }
    for (const [key, child] of Object.entries(record)) {
      // `ref` is the DOM element react-hook-form attaches; never walk into it.
      if (key === "ref" || key === "message" || key === "type") continue;
      walk(child, [...path, key]);
    }
  };
  walk(errors, base);
  return out;
};

export const describePackIssue = (issue: Issue) => {
  const index = issue.path.find((p): p is number => typeof p === "number");
  return index === undefined ? issue.message : `Pack ${index + 1}: ${issue.message}`;
};

export const describeGroupIssue = (issue: Issue) => {
  const numbers = issue.path.filter((p): p is number => typeof p === "number");
  const [group, item] = numbers;
  if (group === undefined) return issue.message;
  if (item === undefined) return `Group ${group + 1}: ${issue.message}`;
  return `Group ${group + 1}, item ${item + 1}: ${issue.message}`;
};