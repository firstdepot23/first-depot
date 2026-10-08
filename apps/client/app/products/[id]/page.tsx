import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { photosForColor } from "@repo/types";
import ProductGallery from "../../components/ProductGallery";
import ProductInteraction from "../../components/ProductInteraction";
import PaymentMethods from "../../components/PaymentMethods";
import { ProductSelectionProvider } from "../../components/ProductSelection";
import { categories } from "../../data/categoryData";
import { getPostsForProduct } from "../../lib/blog";
import { getProduct } from "../../lib/getProduct";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ color?: string; size?: string }>;
};

export const generateMetadata = async ({
  params,
}: Pick<Props, "params">): Promise<Metadata> => {
  const { id } = await params;
  const product = await getProduct(id); // shared with the page: one request
  if (!product) return { title: "Product not found | FIRST DEPOT" };

  const cover = photosForColor(product, product.colors[0] ?? "")[0];
  return {
    title: `${product.name} | FIRST DEPOT`,
    description: product.shortDescription || product.description,
    openGraph: cover ? { images: [cover] } : undefined,
  };
};

const Chevron = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-3 w-3 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 3l5 5-5 5" />
  </svg>
);

const ProductPage = async ({ params, searchParams }: Props) => {
  const { id } = await params;
  const { size, color } = await searchParams;

  const product = await getProduct(id);
  if (!product) notFound();

  // Only trust size/color from the link if the product really has them.
  const selectedSize =
    size && product.sizes.includes(size) ? size : (product.sizes[0] ?? "");
  const selectedColor =
    color && product.colors.includes(color) ? color : (product.colors[0] ?? "");

  const categorySlug = (product as { categorySlug?: string }).categorySlug;
  const categoryName = categorySlug
    ? (categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug)
    : undefined;

  // Blog posts written about this product. A blog hiccup must never take the
  // product page down with it.
  const productId = Number(product.id);
  const posts = Number.isInteger(productId)
    ? await getPostsForProduct(productId, 2).catch((error) => {
        console.error("Failed to load related blog posts:", error);
        return [];
      })
    : [];

  return (
    <ProductSelectionProvider
      initialSize={selectedSize}
      initialColor={selectedColor}
    >
      <div className="pb-8 pt-6 sm:pt-10">
        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500"
        >
          <Link
            href="/products"
            className="transition-colors hover:text-green-700"
          >
            Shop
          </Link>
          {categorySlug && (
            <>
              <Chevron />
              <Link
                href={`/products?category=${encodeURIComponent(categorySlug)}`}
                className="transition-colors hover:text-green-700"
              >
                {categoryName}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-14">
          {/* PHOTOS */}
          <div className="min-w-0 lg:sticky lg:top-20 lg:col-span-6 lg:self-start">
            <ProductGallery product={product} />
          </div>

          {/* DETAILS */}
          <div className="flex min-w-0 flex-col gap-7 lg:col-span-6">
            <header>
              {categoryName && (
                <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
                  {categoryName}
                </p>
              )}
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 [overflow-wrap:anywhere] sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 text-gray-900">
                <span className="mr-1.5 text-sm font-medium text-gray-500">
                  UGX
                </span>
                <span className="text-3xl font-semibold tracking-tight">
                  {product.price.toLocaleString()}
                </span>
              </p>
              <p className="mt-4 text-base leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
                {product.description}
              </p>
            </header>

            <hr className="border-gray-200" />

            <ProductInteraction product={product} />

            <hr className="border-gray-200" />

            <PaymentMethods />

            {/* FROM THE BLOG */}
            {posts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block rounded-2xl border border-gray-200 p-5 transition-shadow hover:shadow-lg hover:shadow-gray-900/5"
                  >
                    <p className="border-l-2 border-green-600 pl-3 text-xs font-medium text-green-600">
                      From the blog
                    </p>
                    <h2 className="mt-3 text-lg font-semibold leading-snug text-gray-900 transition-colors [overflow-wrap:anywhere] group-hover:text-green-700">
                      {post.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">
                      {post.excerpt}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                      Read more <Chevron />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                href="/blog?category=Guides"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-5 transition-shadow hover:shadow-lg hover:shadow-gray-900/5"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    Not sure what to choose?
                  </span>
                  <span className="block text-sm text-gray-500">
                    Read our buying guides.
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors group-hover:text-green-700">
                  Guides <Chevron />
                </span>
              </Link>
            )}

            <p className="text-xs leading-relaxed text-gray-500">
              By placing an order, you agree to our{" "}
              <span className="underline hover:text-gray-900">
                Terms &amp; Conditions
              </span>{" "}
              and{" "}
              <span className="underline hover:text-gray-900">
                Privacy Policy
              </span>
              . You authorize us to charge your selected payment method for the
              total amount shown. All sales are subject to our return and{" "}
              <span className="underline hover:text-gray-900">
                Refund Policies
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </ProductSelectionProvider>
  );
};

export default ProductPage;
