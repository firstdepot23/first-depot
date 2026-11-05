import type { Prisma } from "@repo/product-db";

// Keep in sync with MAX_VARIANTS / MAX_OPTION_GROUPS / MAX_OPTIONS_PER_GROUP
// in @repo/types.
export const MAX_VARIANTS = 30;
export const MAX_OPTION_GROUPS = 10;
export const MAX_OPTIONS_PER_GROUP = 60;

// What every product response carries: its packs and its option groups, in
// the order the admin arranged them.
export const productInclude = {
  variants: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
  optionGroups: {
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  },
} satisfies Prisma.ProductInclude;

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

// "1 Kg", "1  kg" and "1 KG" are the same pack.
export const normalizeLabel = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, " ");

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const isWhole = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

// ---------------------------------------------------------------------
// Packs (grocery)
// ---------------------------------------------------------------------

export type VariantInput = {
  id?: number;
  label: string;
  price: number;
  costPrice: number | null;
  stock: number;
  barcode: string | null;
  sortOrder: number;
};

export const parseVariants = (raw: unknown): Parsed<VariantInput[]> => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, message: "Add at least one pack size with its price" };
  }
  if (raw.length > MAX_VARIANTS) {
    return {
      ok: false,
      message: `A product can have up to ${MAX_VARIANTS} pack sizes`,
    };
  }

  const out: VariantInput[] = [];
  const labels = new Set<string>();
  const barcodes = new Set<string>();

  for (let index = 0; index < raw.length; index += 1) {
    const item: unknown = raw[index];
    const n = index + 1;
    if (!isPlainObject(item)) return { ok: false, message: `Pack ${n} is invalid` };

    const label = text(item.label);
    if (!label) return { ok: false, message: `Pack ${n}: size is required` };
    const key = normalizeLabel(label);
    if (labels.has(key)) {
      return { ok: false, message: `"${label}" is listed twice` };
    }
    labels.add(key);

    if (!isWhole(item.price) || item.price < 1) {
      return {
        ok: false,
        message: `${label}: price must be a whole number of at least 1`,
      };
    }

    let costPrice: number | null = null;
    if (item.costPrice !== undefined && item.costPrice !== null) {
      if (!isWhole(item.costPrice) || item.costPrice < 0) {
        return {
          ok: false,
          message: `${label}: cost price must be a whole number of 0 or more`,
        };
      }
      costPrice = item.costPrice;
    }

    let stock = 0;
    if (item.stock !== undefined && item.stock !== null) {
      if (!isWhole(item.stock) || item.stock < 0) {
        return {
          ok: false,
          message: `${label}: stock must be a whole number of 0 or more`,
        };
      }
      stock = item.stock;
    }

    // A blank barcode is stored as null: barcodes are unique, so two packs
    // with "" would collide.
    const barcode = text(item.barcode) || null;
    if (barcode) {
      if (barcodes.has(barcode)) {
        return { ok: false, message: `Barcode "${barcode}" is used twice` };
      }
      barcodes.add(barcode);
    }

    out.push({
      id: isWhole(item.id) ? item.id : undefined,
      label,
      price: item.price,
      costPrice,
      stock,
      barcode,
      sortOrder: index,
    });
  }

  return { ok: true, value: out };
};

// What the product row itself shows when it has packs: the "from" price, the
// list of pack labels (older code reads `sizes`) and the total stock. The cost
// price is the cost of the cheapest pack, so price and cost describe the same
// pack.
export const summarizeVariants = (variants: VariantInput[]) => {
  const cheapest = variants.reduce((best, v) => (v.price < best.price ? v : best));
  return {
    price: cheapest.price,
    sizes: variants.map((v) => v.label),
    stock: variants.reduce((sum, v) => sum + v.stock, 0),
    costPrice: cheapest.costPrice,
  };
};

export const toVariantCreate = (
  v: VariantInput,
): Prisma.ProductVariantCreateWithoutProductInput => ({
  label: v.label,
  price: v.price,
  costPrice: v.costPrice,
  stock: v.stock,
  barcode: v.barcode,
  sortOrder: v.sortOrder,
});

// Make a product's packs match `rows`. A row updates the pack it names (by id,
// or failing that by the same label); packs not mentioned are removed; the
// rest are created. Keeping the same pack row matters once orders refer to it.
export const syncVariants = async (
  tx: Prisma.TransactionClient,
  productId: number,
  rows: VariantInput[],
) => {
  const existing = await tx.productVariant.findMany({ where: { productId } });
  const byId = new Map(existing.map((v) => [v.id, v]));
  const byLabel = new Map(existing.map((v) => [normalizeLabel(v.label), v]));

  const claimed = new Set<number>();
  const plan = rows.map((row) => {
    const match =
      (row.id !== undefined ? byId.get(row.id) : undefined) ??
      byLabel.get(normalizeLabel(row.label));
    if (match && !claimed.has(match.id)) {
      claimed.add(match.id);
      return { row, match };
    }
    return { row, match: undefined };
  });

  // Remove first, so a label or barcode freed up here can be reused below.
  await tx.productVariant.deleteMany({
    where: { productId, id: { notIn: [...claimed] } },
  });

  for (const { row, match } of plan) {
    if (!match) continue;
    await tx.productVariant.update({
      where: { id: match.id },
      data: {
        label: row.label,
        price: row.price,
        costPrice: row.costPrice,
        stock: row.stock,
        barcode: row.barcode,
        sortOrder: row.sortOrder,
      },
    });
  }
  for (const { row, match } of plan) {
    if (match) continue;
    await tx.productVariant.create({
      data: { ...toVariantCreate(row), product: { connect: { id: productId } } },
    });
  }
};

// ---------------------------------------------------------------------
// Option groups (fast food)
// ---------------------------------------------------------------------

export type OptionInput = {
  name: string;
  extraPrice: number;
  available: boolean;
  sortOrder: number;
};

export type OptionGroupInput = {
  name: string;
  selection: "SINGLE" | "MULTIPLE";
  required: boolean;
  sortOrder: number;
  options: OptionInput[];
};

export const parseOptionGroups = (raw: unknown): Parsed<OptionGroupInput[]> => {
  // An empty list is fine: it clears the product's accompaniments.
  if (!Array.isArray(raw)) {
    return { ok: false, message: "Option groups must be a list" };
  }
  if (raw.length > MAX_OPTION_GROUPS) {
    return {
      ok: false,
      message: `A product can have up to ${MAX_OPTION_GROUPS} option groups`,
    };
  }

  const groups: OptionGroupInput[] = [];

  for (let gi = 0; gi < raw.length; gi += 1) {
    const group: unknown = raw[gi];
    if (!isPlainObject(group)) {
      return { ok: false, message: `Option group ${gi + 1} is invalid` };
    }

    const name = text(group.name);
    if (!name) {
      return { ok: false, message: `Option group ${gi + 1}: name is required` };
    }

    const selection = group.selection ?? "SINGLE";
    if (selection !== "SINGLE" && selection !== "MULTIPLE") {
      return {
        ok: false,
        message: `${name}: choose either "pick one" or "pick several"`,
      };
    }

    if (!Array.isArray(group.options) || group.options.length === 0) {
      return { ok: false, message: `${name}: add at least one item` };
    }
    if (group.options.length > MAX_OPTIONS_PER_GROUP) {
      return {
        ok: false,
        message: `${name}: a group can have up to ${MAX_OPTIONS_PER_GROUP} items`,
      };
    }

    const options: OptionInput[] = [];
    const names = new Set<string>();
    for (let oi = 0; oi < group.options.length; oi += 1) {
      const option: unknown = group.options[oi];
      if (!isPlainObject(option)) {
        return { ok: false, message: `${name}: item ${oi + 1} is invalid` };
      }
      const optionName = text(option.name);
      if (!optionName) {
        return { ok: false, message: `${name}: item ${oi + 1} needs a name` };
      }
      const key = normalizeLabel(optionName);
      if (names.has(key)) {
        return { ok: false, message: `${name}: "${optionName}" is listed twice` };
      }
      names.add(key);

      const extraPrice = option.extraPrice ?? 0;
      if (!isWhole(extraPrice) || extraPrice < 0) {
        return {
          ok: false,
          message: `${name} / ${optionName}: extra price must be a whole number of 0 or more`,
        };
      }
      options.push({
        name: optionName,
        extraPrice,
        available: option.available === false ? false : true,
        sortOrder: oi,
      });
    }

    groups.push({
      name,
      selection,
      required: group.required === true,
      sortOrder: gi,
      options,
    });
  }

  return { ok: true, value: groups };
};

export const toGroupCreate = (
  g: OptionGroupInput,
): Prisma.ProductOptionGroupCreateWithoutProductInput => ({
  name: g.name,
  selection: g.selection,
  required: g.required,
  sortOrder: g.sortOrder,
  options: {
    create: g.options.map((o) => ({
      name: o.name,
      extraPrice: o.extraPrice,
      available: o.available,
      sortOrder: o.sortOrder,
    })),
  },
});