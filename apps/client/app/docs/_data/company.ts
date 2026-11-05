// One place for the facts that appear all over the documents.
// All values below are placeholders: replace them with your real details.

// Icons are available for these networks (see _components/SocialIcons.tsx).
export type SocialId =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube";

// Shown, in this order, in the floating bar at the bottom of the reader.
// Delete a line to hide a network; use your real handles and links.
export const social: { id: SocialId; label: string; href: string }[] = [
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/256781905753" },
  { id: "facebook", label: "Facebook", href: "https://facebook.com/firstdepot" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com/firstdepot23" },
  { id: "x", label: "X", href: "https://x.com/firstdepot23" },
  { id: "tiktok", label: "TikTok", href: "https://tiktok.com/@firstdepot" },
  { id: "youtube", label: "YouTube", href: "https://youtube.com/@firstdepot23" },
];

// ---------------------------------------------------------------------------
// First Depot, Inc. - the parent company. A Delaware technology company that
// owns the group and builds and runs the software and online store used by
// the Ugandan operating companies below.
// Facts taken from the incorporation documents (Certificate of
// Incorporation, SS-4).
export const inc = {
  name: "First Depot Inc",
  legalName: "First Depot, Inc.",
  tagline: "The technology behind the First Depot group of businesses",
  jurisdiction: "Delaware, United States",
  description: "a Delaware technology company",
  mailingAddress: "4283 Express Lane, Suite UG4044, Sarasota, DE 34249, United States",
  registeredOffice:
    "131 Continental Dr, Suite 305, Newark, New Castle County, Delaware 19713, United States",
  registeredAgent: "Legalinc Corporate Services Inc.",
} as const;

// ---------------------------------------------------------------------------
// First Depot Hardwares Limited - the Ugandan hardware company that runs the
// store most customers know. The `company` object below is about THIS
// company (its showroom, phone, hours), because most pages are about it.
export const company = {
  name: "First Depot",
  legalName: "First Depot Hardwares Limited",
  tagline: "Building comfort for your home",
  website: "https://first-depot.com",
  apiBase: "https://api.first-depot.com/v1",
  email: {
    support: "support@first-depot.com",
    trade: "support@first-depot.com",
    privacy: "support@first-depot.com",
    security: "support@first-depot.com",
    developers: "support@first-depot.com",
    partners: "support@first-depot.com",
  },
  phone: "+256 781905753",
  phoneHref: "+256781905753",
  whatsapp: "+256 777433635",
  whatsappHref: "https://wa.me/256777433635",
  address: "Ojwina Road - Wigweng, Barogole, Lira City West, Lira City, Uganda",
  postaladdress: "P. O. Box 332500, LIRA",
  // The payment processor the online store actually uses today.
  // First Depot Pay (see `businesses` below) is a separate, planned product.
  paymentProvider: "Pesapal",
  hours: {
    weekdays: "Monday to Saturday, 8:00 am to 6:00 pm",
    sunday: "Sunday, 9:00 am to 5:00 pm",
    timezone: "East Africa Time",
  },
} as const;

// ---------------------------------------------------------------------------
// GLS - the sales and general ledger software built to run First Depot
// Hardwares, and now offered to other businesses. It is a technology product,
// so it is run by First Depot, Inc. It has its own customers (businesses, not
// shoppers), so it keeps its own identity, contact addresses and - in
// gls-terms.ts / gls-privacy.ts - its own policies.
//
// ("Oxford Technology Company", shown in GLS's old app footer, was a name
// considered and then dropped since it was already registered elsewhere - it
// is not First Depot's and should not appear anywhere in the product or
// these docs.)
export const gls = {
  name: "GLS",
  fullName: "General Ledger System",
  legalName: "First Depot, Inc., trading as GLS",
  tagline: "The software behind First Depot, built for your business too",
  website: "https://gls.first-depot.com",
  pricingUrl: "https://gls.first-depot.com/#pricing",
  registerUrl: "https://gls.first-depot.com/register",
  // The processor GLS subscription billing actually runs on today.
  paymentProvider: "Stripe",
  email: {
    support: "support@gls.first-depot.com",
    sales: "sales@gls.first-depot.com",
    privacy: "privacy@gls.first-depot.com",
  },
} as const;

// ---------------------------------------------------------------------------
// The group structure: First Depot, Inc. is the parent. It runs the products
// (software, online store, platform) of three companies registered in Uganda.
export const group = {
  parentName: inc.legalName,
  note:
    "First Depot, Inc., a Delaware technology company, is the parent of the group. It builds and runs the technology used by three companies registered in Uganda: First Depot Hardwares Limited, OxPharm Health Limited and MD Clove. Each of those companies is a separate legal entity and runs its own shop.",
} as const;

export type BusinessStatus = "operating" | "operating-expanding" | "planned";

export type Business = {
  id: string;
  name: string;
  /** The legal entity that runs it. */
  legalName: string;
  kind:
    | "Retail"
    | "Pharmacy"
    | "Grocery"
    | "Software"
    | "Financial services"
    | "Logistics";
  status: BusinessStatus;
  statusLabel: string;
  summary: string;
  website?: string;
  /** Slug of this business's own page under /docs, if it has one. */
  docsSlug?: string;
};

// The group's businesses and product lines, in the order they should be
// listed. Statuses are deliberately plain-language, not a marketing label.
export const businesses: Business[] = [
  {
    id: "hardwares",
    name: "First Depot Hardwares",
    legalName: "First Depot Hardwares Limited",
    kind: "Retail",
    status: "operating",
    statusLabel: "Operating",
    summary:
      "Our hardware and home improvement store: paints, electricals, pumps and plumbing, tiles and building materials, delivered to where the work is happening.",
    website: company.website,
    docsSlug: "about",
  },
  {
    id: "oxpharm",
    name: "OxPharm Health",
    legalName: "OxPharm Health Limited",
    kind: "Pharmacy",
    status: "operating",
    statusLabel: "Operating",
    summary:
      "Our pharmacy: health, wellness and care products for the home and family.",
  },
  {
    id: "mdclove",
    name: "MD Clove",
    legalName: "MD Clove",
    kind: "Grocery",
    status: "operating",
    statusLabel: "Operating",
    summary:
      "Our grocery business: food, drinks and household essentials.",
  },
  {
    id: "gls",
    name: "GLS (General Ledger System)",
    legalName: "First Depot, Inc.",
    kind: "Software",
    status: "operating",
    statusLabel: "Operating - open for other businesses to sign up",
    summary:
      "The sales and general ledger software we built to run First Depot Hardwares day to day. Any business can now sign up and subscribe.",
    website: gls.website,
    docsSlug: "gls",
  },
  {
    id: "pay",
    name: "First Depot Pay",
    legalName: "First Depot, Inc.",
    kind: "Financial services",
    status: "planned",
    statusLabel: "Planned",
    summary:
      "A payment gateway, starting with the group's own checkout and GLS billing, and eventually offered to other merchants.",
  },
  {
    id: "supply-chain",
    name: "First Depot Supply Chain",
    legalName: "First Depot, Inc.",
    kind: "Logistics",
    status: "planned",
    statusLabel: "Planned",
    summary:
      "A software platform for the transportation and warehousing services we already offer, so other businesses can plan and track deliveries the way we do.",
  },
];