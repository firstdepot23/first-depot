import type { Metadata } from "next";
import ProductList from "./components/ProductList";

// Every page declares its OWN canonical address. The root layout must not
// set one, or all pages would claim to be copies of the homepage.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string }>;
}) => {
  const category = (await searchParams).category;
  return (
    <div className="pt-2 sm:pt-4">
      {/* The page's main heading, for search engines and screen readers.
          Remove "sr-only" if you would like it to be visible. */}
      <h1 className="sr-only">
        First Depot: Hardware &amp; Home Improvement Company in Lira, Uganda
      </h1>
      <ProductList category={category} params="homepage" />
    </div>
  );
};

export default Homepage;
