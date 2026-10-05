import { ProductsType } from "@repo/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const getData = async (): Promise<ProductsType> => {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_PRODUCT_SERVICE_URL is not set");
  }

  const res = await fetch(`${baseUrl}/products`, {
    cache: "no-store",
    // Without a timeout this page can hang for a minute or more when the
    // product service is asleep or down (it did exactly that during the
    // build). 15s leaves room for a cold start on a small instance.
    signal: AbortSignal.timeout(15000),
  });

  // Without this check, an error reply such as {"message": "..."} was passed
  // to the table as if it were a list of products and crashed it.
  if (!res.ok) {
    throw new Error(`Product service responded with ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Product service returned unexpected data");
  }

  return data as ProductsType;
};

// Failures are thrown on purpose: the dashboard's error.tsx shows
// "Something went wrong" with a Try again button, which is better than a
// misleading "No results." table that looks like there are no products.
const ProductPage = async () => {
  const data = await getData();
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Products</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default ProductPage;
