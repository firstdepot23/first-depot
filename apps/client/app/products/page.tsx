import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductList from "../components/ProductList";
import { DEFAULT_SEGMENT, parseSegment, SEGMENT_META } from "../data/segments";

type SearchParams = Promise<{
  segment?: string | string[];
  category?: string;
  sort?: string;
  search?: string;
}>;

// Which section a /products URL is about:
//  - ?segment=grocery            -> grocery
//  - ?category=glass (no segment) -> hardware. Old links, bookmarks and blog
//    posts were made before segments existed and all pointed at hardware.
//  - neither                      -> undefined: the grouped "all products" view
const resolveSegment = (
  segment: string | string[] | undefined,
  category: string | undefined,
) => parseSegment(segment) ?? (category ? DEFAULT_SEGMENT : undefined);

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> => {
  const { segment, category } = await searchParams;
  const resolved = resolveSegment(segment, category);

  // Each section is its own page for search engines: without this every
  // section would claim to be a copy of /products.
  return {
    title: resolved ? SEGMENT_META[resolved].title : "All products",
    alternates: {
      canonical: resolved ? `/products?segment=${resolved}` : "/products",
    },
  };
};

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const { segment, category, sort, search } = await searchParams;
  const resolved = resolveSegment(segment, category);

  // The pharmacy has its own section (/pharmacy). Old links, the site menu and
  // search results that still point at /products?segment=pharmacy land there,
  // with their category / search kept.
  if (resolved === "pharmacy") {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (search) q.set("search", search);
    if (sort) q.set("sort", sort);
    const query = q.toString();
    redirect(query ? `/pharmacy?${query}` : "/pharmacy");
  }

  return (
    <div className="">
      <ProductList
        segment={resolved}
        category={category}
        sort={sort}
        search={search}
        params="products"
      />
    </div>
  );
};

export default ProductsPage;
