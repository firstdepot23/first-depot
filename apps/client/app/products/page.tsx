import ProductList from "../components/ProductList";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/products",
  },
};

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string; sort: string; search: string }>;
}) => {
  const category = (await searchParams).category;
  const sort = (await searchParams).sort;
  const search = (await searchParams).search;
  return (
    <div className="">
      <ProductList
        category={category}
        sort={sort}
        search={search}
        params="products"
      />
    </div>
  );
};

export default ProductsPage;
