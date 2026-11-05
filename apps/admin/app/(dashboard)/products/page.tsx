import {
  SEGMENT_LABELS,
  SEGMENT_ORDER,
  type ProductsType,
  type Segment,
} from "@repo/types";
import { fetchProducts } from "../../lib/fetchProducts";
import { requireAdmin } from "../../lib/requireAdmin";
import ProductsTable from "./productsTable";

const getData = async (segment?: Segment): Promise<ProductsType> => {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_PRODUCT_SERVICE_URL is not set");
  }

  // Retries for a sleeping service, and explains any failure in detail
  // (status, content type and the start of what came back).
  return fetchProducts(baseUrl, { segment });
};

// /products               -> every segment, grouped Grocery, Pharmacy, Hardware
// /products?segment=GROCERY -> just that segment
const ProductPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string | string[] }>;
}) => {
  await requireAdmin();

  const { segment: rawSegment } = await searchParams;
  const value = Array.isArray(rawSegment) ? rawSegment[0] : rawSegment;
  // An unknown value is ignored rather than shown as an error.
  const segment = SEGMENT_ORDER.find((s) => s === value);

  const fetched = await getData(segment);
  // Array.sort is stable, so within a segment the service's newest-first
  // order is kept.
  const data = segment
    ? fetched
    : [...fetched].sort(
        (a, b) =>
          SEGMENT_ORDER.indexOf(a.segment) - SEGMENT_ORDER.indexOf(b.segment),
      );

  const title = segment ? `${SEGMENT_LABELS[segment]} Products` : "All Products";

  return (
    <div className="">
      <div className="mb-8 flex items-center justify-between rounded-md bg-secondary px-4 py-2">
        <h1 className="font-semibold">{title}</h1>
        <span className="text-xs text-muted-foreground">
          {data.length} {data.length === 1 ? "product" : "products"}
        </span>
      </div>
      <ProductsTable products={data} />
    </div>
  );
};

export default ProductPage;
