import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://first-depot.com";

// Delete public/robots.txt if you have one: this file replaces it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private pages that should never appear in search.
        // /cart also covers /cart/shipping and /cart/payment.
        disallow: ["/cart", "/orders", "/payment/", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}