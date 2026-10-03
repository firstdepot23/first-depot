import Image from "next/image";
import ProductList from "./components/ProductList";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string }>;
}) => {
  const category = (await searchParams).category;
  return (
    <div className="pt-2 sm:pt-4">
      {/* Re-enable when /public/featured.png exists:
      <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-lg sm:mb-8 sm:aspect-[30/9]">
        <Image
          src="/featured.png"
          alt="Featured Product"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      */}
      <ProductList category={category} params="homepage" />
    </div>
  );
};

export default Homepage;
