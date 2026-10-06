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

    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Product service responded with ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Product service returned unexpected data");
  }

  return data as ProductsType;
};

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
