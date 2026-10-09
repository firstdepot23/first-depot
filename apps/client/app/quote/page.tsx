import type { Metadata } from "next";
import { prisma } from "@repo/product-db";
import { PRICE_DIVISOR } from "./_config";
import QuoteForm from "./QuoteForm";
import type { CatalogProduct } from "./schema";

export const metadata: Metadata = {
  title: "Get a quote | FIRST DEPOT",
  description:
    "Send us your bill of quantities or a list of items and we'll price it, confirm stock and arrange delivery.",
};

// Product list is cached for five minutes.
export const revalidate = 300;

const loadCatalog = async (): Promise<CatalogProduct[]> => {
  try {
    const rows = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        shortDescription: true,
        price: true,
        sizes: true,
        categorySlug: true,
      },
      orderBy: { name: "asc" },
      take: 2000,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      shortDescription: r.shortDescription,
      price: r.price / PRICE_DIVISOR,
      sizes: r.sizes,
      category: r.categorySlug,
    }));
  } catch (error) {
    // The form still works: customers can type their own items.
    console.error("Quote page: could not load products", error);
    return [];
  }
};

const QuotePage = async () => {
  const catalog = await loadCatalog();
  return (
    <div className="pb-16 pt-8 sm:pt-12">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Get a quote
        </h1>
        <p className="mt-3 text-base text-gray-500">
          Build your bill of quantities below. Pick items from our catalogue or
          add your own, with your own prices if you have them. We reply with a
          confirmed price, stock and delivery.
        </p>
      </header>
      <QuoteForm catalog={catalog} />
    </div>
  );
};

export default QuotePage;
