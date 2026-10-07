// Sample content: replace with your real posts (or load from a CMS / database later).
/*
export type Author = { name: string; role: string };

export type CoverVariant = "green" | "sunset" | "dark" | "stat";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Guides" | "Projects" | "Product" | "Industry";
  date: string; // ISO date
  authors: Author[];
  cover: {
    variant: CoverVariant;
    text: string; // caption on the cover
    stat?: string; // big number, used by the "stat" variant
  };
  body: string[];
};

export const categories: Post["category"][] = [
  "Guides",
  "Projects",
  "Product",
  "Industry",
];

export const posts: Post[] = [
  {
    slug: "choosing-the-right-paint",
    title: "How to choose the right paint for every room",
    excerpt:
      "Matt, silk or gloss? Emulsion or enamel? A simple room-by-room guide to picking paint that looks good and lasts through the heat, dust and rainy seasons.",
    category: "Guides",
    date: "2026-09-30",
    authors: [{ name: "Grace Namukasa", role: "Interior Specialist, First Depot" }],
    cover: { variant: "green", text: "Choosing paint, room by room" },
    body: [
      "The right paint starts with the room, not the colour. Kitchens and bathrooms need a finish that can be wiped clean and resist moisture, while bedrooms and living rooms can use a softer matt finish that hides small wall imperfections.",
      "Outside walls face sun and heavy rain, so choose an exterior-grade paint and give the surface time to dry fully before the first coat. Cheap paint applied to a damp wall is the most common reason for peeling.",
      "Before you buy, measure the wall area and check the coverage printed on the tin. Buying slightly more than you need keeps every coat from the same batch, so the colour stays even.",
    ],
  },
  {
    slug: "roofing-materials-compared",
    title: "Roofing materials compared: what holds up best at home",
    excerpt:
      "Iron sheets, stone-coated tiles and clay tiles each handle sun, rain and noise differently. Here is how to weigh cost, lifespan and upkeep before you commit.",
    category: "Guides",
    date: "2026-09-29",
    authors: [{ name: "Moses Kato", role: "Building Materials Lead, First Depot" }],
    cover: { variant: "sunset", text: "Roofing, compared" },
    body: [
      "A roof is the biggest single protection for your home, so it deserves more than a price comparison. Think about how long you plan to stay, how loud heavy rain is under the material, and how hot the rooms get at midday.",
      "Gauge matters as much as the material. Thin iron sheets dent and corrode early, while a heavier gauge costs more upfront and saves you a re-roof later.",
      "Whatever you choose, make sure the timber structure underneath is sound and the fixings are suited to the sheet or tile. Most leaks start at the nails and the joints, not the surface.",
    ],
  },
  {
    slug: "get-a-quote-from-your-phone",
    title: "Planning a build? Get a materials quote from your phone",
    excerpt:
      "Send us your list, a drawing or just a description of the job and we will come back with quantities, prices and delivery options so you can plan with confidence.",
    category: "Product",
    date: "2026-09-28",
    authors: [{ name: "Daniel Okello", role: "Customer Experience, First Depot" }],
    cover: { variant: "dark", text: "Quotes without the queue" },
    body: [
      "Walking from shop to shop for prices takes days. A quote request lets you share what you need once and compare the answer at your own pace.",
      "Include the size of the job, the materials you already have, and where the delivery should go. The more detail you give, the closer the first quote will be to the final one.",
      "You can adjust quantities before you order, so a quote is a safe way to plan a budget before you spend anything.",
    ],
  },
  {
    slug: "weekend-upgrades-under-500k",
    title: "Five weekend upgrades that cost less than UGX 500,000",
    excerpt:
      "You do not need a full renovation to make a home feel new. These small projects take a weekend or less and make a visible difference.",
    category: "Projects",
    date: "2026-09-17",
    authors: [
      { name: "Grace Namukasa", role: "Interior Specialist, First Depot" },
      { name: "Moses Kato", role: "Building Materials Lead, First Depot" },
    ],
    cover: {
      variant: "stat",
      stat: "5",
      text: "weekend upgrades for under UGX 500,000",
    },
    body: [
      "Fresh paint on one feature wall, new light fittings, a replaced tap set, a tiled splashback and tidy door hardware: each one is a few hours of work and changes how a room feels.",
      "Start with the upgrade you will notice every day. A kitchen tap that drips or a hallway that is too dark is worth fixing before anything decorative.",
      "Price the materials first, then decide whether to do the job yourself or book a fundi. Many of these projects need only basic hand tools.",
    ],
  },
  {
    slug: "renovation-budget-step-by-step",
    title: "Planning a renovation budget, step by step",
    excerpt:
      "Most renovations run over because the budget skipped something. A short checklist to cover materials, labour, delivery and the surprises you will meet along the way.",
    category: "Guides",
    date: "2026-09-12",
    authors: [{ name: "Daniel Okello", role: "Customer Experience, First Depot" }],
    cover: { variant: "green", text: "A renovation budget that holds" },
    body: [
      "List every room and every task, then price materials and labour separately. Seeing them apart shows you where the money goes and where you can trade down without hurting quality.",
      "Add a buffer of around ten percent for the things you cannot see yet, like old plumbing behind a wall or uneven floors under old tiles.",
      "Order big items early. Delivery dates are easier to plan around than a crew waiting on missing materials.",
    ],
  },
  {
    slug: "pay-with-mobile-money",
    title: "Paying with MTN Mobile Money and Airtel Money at checkout",
    excerpt:
      "Checkout supports cards and mobile money. Here is how each payment works, what to expect on your phone, and what to do if a payment does not go through.",
    category: "Product",
    date: "2026-08-20",
    authors: [{ name: "Daniel Okello", role: "Customer Experience, First Depot" }],
    cover: { variant: "sunset", text: "Pay the way you already do" },
    body: [
      "Choose your payment method at checkout and enter the phone number registered to your mobile money account. You will get a prompt on your phone to approve the payment with your PIN.",
      "Keep your phone nearby and your balance topped up before you confirm. The prompt expires after a short time, and you can always retry from your order page.",
      "If money leaves your account but the order does not show as paid, contact support with your transaction reference and we will sort it out.",
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }); */

  import { cache } from "react";
import {
  BlogCategories,
  getPublishedPostBySlug,
  getPublishedPosts,
  getRelatedPosts,
} from "@repo/blog-db";
import type { BlogPostType } from "@repo/types";

// Server-only: this reads MongoDB through @repo/blog-db. Import it from
// server components (pages), never from a "use client" file.

export type Author = BlogPostType["authors"][number];
export type CoverVariant = BlogPostType["cover"]["variant"];

// Same shape the pages and PostCover already use.
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogPostType["category"];
  date: string; // ISO date
  authors: Author[];
  cover: BlogPostType["cover"];
  body: string[];
};

export const categories: Post["category"][] = [...BlogCategories];

const toPost = (p: BlogPostType): Post => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  date: p.publishedAt,
  authors: p.authors,
  cover: p.cover,
  body: p.body,
});

export const getPosts = async (category?: Post["category"]) =>
  (await getPublishedPosts(category)).map(toPost);

// cache() so generateMetadata and the page share one database read.
export const getPost = cache(async (slug: string) => {
  const post = await getPublishedPostBySlug(slug);
  return post ? toPost(post) : undefined;
});

export const getMorePosts = async (slug: string, limit = 2) =>
  (await getRelatedPosts(slug, limit)).map(toPost);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });