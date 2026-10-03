import { ProductType } from "@repo/types";
import Categories from "./Categories";
import ProductCard from "./ProductCard";
import Link from "next/link";
import Filter from "./Filter";
import RetryButton from "./RetryButton";

type FetchResult =
  { ok: true; products: ProductType[] } | { ok: false; message: string };

const fetchData = async ({
  category,
  sort,
  search,
  params,
}: {
  category?: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}): Promise<FetchResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

  if (!baseUrl) {
    console.error("NEXT_PUBLIC_PRODUCT_SERVICE_URL is not set");
    return {
      ok: false,
      message: "The product service is not configured.",
    };
  }

  // URLSearchParams encodes values safely and avoids stray "&" issues.
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (search) query.set("search", search);
  query.set("sort", sort || "newest");
  if (params === "homepage") query.set("limit", "8");

  try {
    const res = await fetch(`${baseUrl}/products?${query.toString()}`, {
      cache: "no-store",
      // Fail fast (8s) instead of hanging the whole page for 10s+ on a dead server.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`Product service responded with ${res.status}`);
      return {
        ok: false,
        message:
          "Our product service is having trouble right now. Please try again shortly.",
      };
    }

    const data: ProductType[] = await res.json();
    return { ok: true, products: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error("Failed to fetch products:", error);

    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return {
      ok: false,
      message: isTimeout
        ? "The request took too long. Please check your internet connection and try again."
        : "We couldn't reach the server. Please check your internet connection and try again.",
    };
  }
};

const ProductList = async ({
  category,
  sort,
  search,
  params,
}: {
  category: string;
  sort?: string;
  search?: string;
  params: "homepage" | "products";
}) => {
  const result = await fetchData({ category, sort, search, params });

  return (
    <div className="w-full">
      {/*<Categories />
      {params === "products" && <Filter />}*/}

      <div className="flex flex-col divide-y divide-gray-100 mt-3">
        {!result.ok ? (
          <div
            role="alert"
            className="py-12 flex flex-col items-center gap-3 text-center"
          >
            <p className="text-base font-medium text-gray-800">
              Unable to load products
            </p>
            <p className="text-sm text-gray-500 max-w-md">{result.message}</p>
            <RetryButton />
          </div>
        ) : result.products.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No products found.
          </p>
        ) : (
          result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      <Link
        href={category ? `/products/?category=${category}` : "/products"}
        className="flex justify-end mt-4 underline text-sm text-gray-500"
      >
        View all products
      </Link>
    </div>
  );
};

export default ProductList;
