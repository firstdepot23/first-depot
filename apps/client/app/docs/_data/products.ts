import { existsSync } from "node:fs";
import path from "node:path";
import { company as c, businesses as list } from "./company";
import { SEGMENT_META, SEGMENT_SLUGS, type SegmentSlug } from "../../data/segments";
import {
  p,
  h3,
  note,
  productGrid,
  type Block,
  type DocPage,
  type ProductItem,
} from "./schema";

// ---------------------------------------------------------------------------
// SAMPLE DATA. Every product, price and image below is a placeholder.
// Replace the items with real ones (or build this list from the product API)
// and swap the placehold.co image URLs for your real photo URLs.
//
// Structure: one section per storefront segment (from segments.ts), each sold
// by one company (from the businesses list in company.ts):
//   hardware -> First Depot Hardwares Limited
//   grocery  -> MD Clove
//   fastfood -> no separate company yet: shown under the group's own name
//   pharmacy -> OxPharm Health Limited
// ---------------------------------------------------------------------------

const COMPANY_FOR: Record<SegmentSlug, string> = {
  hardware: "hardwares",
  grocery: "mdclove",
  // No matching business in company.ts, so the section falls back to the
  // group's own name. Put a business id here when fast food has its own company.
  fastfood: "",
  pharmacy: "oxpharm",
};

// Placeholder image colours per segment (background / text).
const PALETTE: Record<SegmentSlug, { bg: string; fg: string }> = {
  hardware: { bg: "c3e1d6", fg: "1e4a3c" },
  grocery: { bg: "f3e3b3", fg: "5a4300" },
  fastfood: { bg: "f6d5c4", fg: "6b2e12" },
  pharmacy: { bg: "d6e4f5", fg: "1f3d66" },
};

const ugx = (amount: number) => `UGX ${amount.toLocaleString("en-US")}`;

// IMAGES
// Put your showroom photos in your Next.js `public/products/<segment>/` folder,
// named after the product (see product-images-needed.md for the exact file
// names), e.g. public/products/hardware/cement-50-kg.jpg
// Photos: JPG, PNG or WebP, 3:2 landscape (for example 1200 x 800), under
// ~200 KB. Any product without a photo yet shows a labelled placeholder, so
// you can add photos one at a time. To serve photos from a CDN instead,
// change IMAGE_BASE to its address and drop the file check below.
const IMAGE_BASE = "/products";
const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const localImage = (segment: SegmentSlug, name: string): string | null => {
  for (const ext of EXTENSIONS) {
    const url = `${IMAGE_BASE}/${segment}/${slugify(name)}.${ext}`;
    try {
      if (existsSync(path.join(process.cwd(), "public", url))) return url;
    } catch {
      /* no filesystem access: fall back to the placeholder */
    }
  }
  return null;
};

const imageFor = (segment: SegmentSlug, name: string) =>
  localImage(segment, name) ??
  `https://placehold.co/600x400/${PALETTE[segment].bg}/${PALETTE[segment].fg}?text=${encodeURIComponent(name)}`;

const make =
  (segment: SegmentSlug) =>
  (name: string, price: number, blurb?: string): ProductItem => ({
    name,
    price: ugx(price),
    blurb,
    image: imageFor(segment, name),
  });

const hw = make("hardware");
const gr = make("grocery");
const ff = make("fastfood");
const ph = make("pharmacy");

type Category = { title: string; blurb?: string; items: ProductItem[] };

const catalogue: Record<SegmentSlug, Category[]> = {
  hardware: [
    {
      title: "Paints and coatings",
      blurb: "Interior and exterior paints, with colour matching in the showroom.",
      items: [
        hw("Interior Emulsion, White, 20 L", 185000, "Smooth matt finish"),
        hw("Gloss Enamel, Black, 4 L", 62000, "Wood and metal"),
        hw("Wall Filler, 5 kg", 28000, "Fills cracks and holes"),
      ],
    },
    {
      title: "Electricals",
      blurb: "Certified products for new builds, rewiring and maintenance.",
      items: [
        hw("Twin and Earth Cable 2.5 mm, 100 m", 240000, "Copper, for sockets"),
        hw("13A Double Socket", 18000, "White, switched"),
        hw("LED Bulb 12 W", 6500, "Warm white, E27"),
      ],
    },
    {
      title: "Pumps and plumbing",
      blurb: "Everything to move, store and control water.",
      items: [
        hw("Surface Water Pump, 1 HP", 380000, "For tanks and boreholes"),
        hw("PVC Pipe 1 inch, 6 m", 22000, "Pressure rated"),
        hw("Water Tank, 5,000 L", 1450000, "UV-stabilised"),
      ],
    },
    {
      title: "Tiles and flooring",
      items: [
        hw("Porcelain Floor Tile 60 x 60 cm", 48000, "Per square metre"),
        hw("Tile Adhesive, 25 kg", 32000, "Floor and wall"),
      ],
    },
    {
      title: "Building materials",
      blurb: "Core materials, delivered to site in bulk.",
      items: [
        hw("Cement, 50 kg", 36000, "Portland cement"),
        hw("Iron Sheet, Gauge 28, 3 m", 42000, "Pre-painted"),
        hw("Steel Bar Y12, 12 m", 52000, "Reinforcement"),
      ],
    },
    {
      title: "General hardware and tools",
      items: [
        hw("Claw Hammer, 16 oz", 15000, "Fibreglass handle"),
        hw("Cordless Drill, 18 V", 260000, "With battery and charger"),
        hw("Safety Helmet", 12000, "Adjustable"),
      ],
    },
  ],
  grocery: [
    {
      title: "Pantry staples",
      items: [
        gr("Rice, 5 kg", 28000, "Long grain"),
        gr("Maize Flour, 2 kg", 7500, "Fine, sifted"),
        gr("Cooking Oil, 3 L", 24000, "Vegetable"),
        gr("Sugar, 1 kg", 5200, "White granulated"),
      ],
    },
    {
      title: "Drinks",
      items: [
        gr("Bottled Water, 12 x 500 ml", 14000, "Still"),
        gr("Black Tea Leaves, 250 g", 4800, "Loose leaf"),
        gr("Orange Juice, 1 L", 6500, "No added sugar"),
      ],
    },
    {
      title: "Household essentials",
      items: [
        gr("Laundry Detergent, 1 kg", 9000, "Hand and machine wash"),
        gr("Dish Soap, 750 ml", 5500, "Lemon"),
        gr("Toilet Paper, 10 rolls", 12000, "2-ply"),
      ],
    },
  ],
  fastfood: [
    {
      title: "Meals",
      blurb: "Made to order. Pick your accompaniment when you order.",
      items: [
        ff("Chicken and Chips", 22000, "Choose chips or rice"),
        ff("Beef Burger", 18000, "Add cheese or bacon"),
        ff("Fish Fingers Meal", 20000, "Choose your side"),
      ],
    },
    {
      title: "Drinks",
      items: [
        ff("Fresh Passion Juice", 6000, "Chilled"),
        ff("Soda, 500 ml", 3000, "Assorted"),
      ],
    },
  ],
  pharmacy: [
    {
      title: "Health and wellness",
      items: [
        ph("Vitamin C Effervescent Tablets", 15000, "20 tablets"),
        ph("Oral Rehydration Salts, 10 sachets", 6000, "Orange flavour"),
        ph("Digital Thermometer", 14000, "Fast read"),
      ],
    },
    {
      title: "First aid",
      items: [
        ph("Adhesive Plasters, Assorted", 4000, "Box of 40"),
        ph("Antiseptic Liquid, 250 ml", 7500, "For cuts and grazes"),
        ph("First Aid Kit, Home", 38000, "Basic essentials"),
      ],
    },
    {
      title: "Personal and family care",
      items: [
        ph("Hand Sanitiser, 500 ml", 9000, "70% alcohol"),
        ph("Sunscreen SPF 50, 100 ml", 26000, "Water resistant"),
        ph("Baby Diapers, Size 3, 40 pack", 42000, "Soft and absorbent"),
      ],
    },
  ],
};

// A short safety note at the end of a segment's section.
const closing: Partial<Record<SegmentSlug, string>> = {
  hardware: `Electrical installation should always be carried out by a qualified electrician.`,
  pharmacy: `Always read the label and use products as directed. If you are unsure, ask a pharmacist or your doctor.`,
};

export const products: DocPage = {
  slug: "products",
  title: "Products",
  subtitle: "Everything for the home, the building site and the family",
  blurb: "what we stock, by company",
  group: "Build and shop",
  updated: "October 2026",
  intro: [
    p(
      `Here is a guide to the main products across the First Depot group, organised by shop. Stock changes often, so check the shop or call us for today's availability and prices.`,
    ),
    note(
      `The products, prices and pictures on this page are samples. See the shop for what is in stock today.`,
    ),
  ],
  sections: [
    ...SEGMENT_SLUGS.map((slug) => {
      const meta = SEGMENT_META[slug];
      const company = list.find((b) => b.id === COMPANY_FOR[slug]);
      const blocks: Block[] = [
        p(`${meta.subtitle} Sold by **${company?.legalName ?? c.legalName}**.`),
      ];

      for (const category of catalogue[slug]) {
        blocks.push(h3(category.title));
        if (category.blurb) blocks.push(p(category.blurb));
        blocks.push(productGrid(...category.items));
      }

      const closingNote = closing[slug];
      if (closingNote) blocks.push(note(closingNote));

      return {
        id: slug,
        title: `${meta.title}: ${company?.name ?? c.name}`,
        blocks,
      };
    }),
    {
      id: "services",
      title: "Advice and extras",
      blocks: [
        p(
          `Not sure what you need? Bring your plans, photos or measurements and our team will help you choose, calculate quantities and plan delivery. Trade customers can also ask for quotes and scheduled deliveries.`,
        ),
        p(
          `Talk to us on [${c.phone}](tel:${c.phoneHref}), by [WhatsApp](${c.whatsappHref}), or visit the [Contacts](/docs/contacts) page.`,
        ),
      ],
    },
  ],
};