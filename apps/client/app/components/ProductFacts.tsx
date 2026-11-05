import type { ProductType } from "@repo/types";

const formatDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  // Stored as UTC midnight: format in UTC so the day never shifts.
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

/**
 * What a shopper needs to know about a grocery or pharmacy product before
 * buying: ingredient/strength/form, who made it, how to store it, its
 * registration number and its expiry. Renders nothing for hardware.
 */
const ProductFacts = ({ product }: { product: ProductType }) => {
  if (product.segment === "HARDWARE") return null;

  const rows: [label: string, value: string | null | undefined][] =
    product.segment === "PHARMACY"
      ? [
          ["Active ingredient", product.activeIngredient],
          ["Strength", product.dosageStrength],
          ["Form", product.formulation],
          ["Manufacturer", product.manufacturer],
          ["Storage", product.storageConditions],
          ["Registration no.", product.registrationNumber],
          ["Expiry date", formatDate(product.expiryDate)],
        ]
      : [["Best before", formatDate(product.expiryDate)]];

  const shown = rows.filter(
    (row): row is [string, string] => typeof row[1] === "string" && !!row[1],
  );
  if (shown.length === 0) return null;

  return (
    <>
      <hr className="border-gray-200" />
      <section aria-labelledby="product-info">
        <h2 id="product-info" className="text-sm font-semibold text-gray-900">
          Product information
        </h2>
        <dl className="mt-3 divide-y divide-gray-100 text-sm">
          {shown.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 py-2.5"
            >
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-gray-900 [overflow-wrap:anywhere]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
};

export default ProductFacts;
