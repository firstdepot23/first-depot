// Structured data that tells Google who First Depot is. It feeds the logo in
// search results, the site name, and (once Google decides to show one) the
// company panel on the right of the results page.
//
// EVERY FACT HERE MIRRORS THE COMPANY DOCUMENTS:
//   company.ts   -> name, tagline, phone, email, address, hours, social links
//   about.ts     -> what the company is and does (incl. transport/warehousing)
//   products.ts  -> the product families in the catalog below
//   help.ts      -> delivery cities (read straight from @repo/types, the same
//                   list the checkout uses), payment methods, pickup
// If you change one of those, change it here too, and keep it identical to
// your Google Business Profile and social pages.

import { DELIVERY_CITIES, DELIVERY_CITY_INFO } from "@repo/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://first-depot.com";

const NAME = "First Depot";
const LEGAL_NAME = "First Depot Hardwares Limited";
const TAGLINE = "Building comfort for your home"; // company.tagline

// The short label Google can show beside the name, like "Home Depot - Home
// improvement company". Google chooses whether to show it; this is our
// strongest hint of what it should say.
const DESCRIPTOR = "Hardware & Home Improvement Company";

const PHONE = "+256781905753"; // company.phoneHref
const EMAIL = "support@first-depot.com"; // company.email.support

// Delivery goes to these cities (help.ts "Delivery"). "other" is a catch-all,
// not a place, so it is left out.
const deliveryCities = DELIVERY_CITIES.filter((key) => key !== "other").map(
  (key) => ({ "@type": "City", name: DELIVERY_CITY_INFO[key].label }),
);

// The product families from products.ts. The ids are that page's anchors.
const productFamilies = [
  { id: "paints", name: "Paints and coatings" },
  { id: "electricals", name: "Electricals" },
  { id: "pumps-plumbing", name: "Pumps and plumbing" },
  { id: "tiles", name: "Tiles and flooring" },
  { id: "building-materials", name: "Building materials" },
  { id: "hardware-tools", name: "General hardware and tools" },
];

const services = [
  {
    name: "Delivery across Uganda",
    url: `${SITE}/docs/help-center#delivery`,
  },
  {
    name: "Free pickup from our station",
    url: `${SITE}/docs/help-center#delivery`,
  },
  {
    name: "Paint colour matching in the showroom",
    url: `${SITE}/docs/products#paints`,
  },
  {
    name: "Advice, quotes and scheduled deliveries for trade customers",
    url: `${SITE}/docs/products#services`,
  },
  {
    name: "Transportation and warehousing (logistics and supply chain)",
    url: `${SITE}/docs/about`,
  },
];

const organization = {
  "@type": ["HardwareStore", "HomeAndConstructionBusiness"],
  "@id": `${SITE}/#organization`,
  name: NAME,
  legalName: LEGAL_NAME,
  // How people actually write the name, including as one word.
  alternateName: [
    "FirstDepot",
    "First Depot Hardwares",
    "First Depot Uganda",
    "First Depot Lira",
  ],
  description:
    "First Depot Hardwares Limited is a Ugandan hardware and home improvement company in Lira. We supply paints, electricals, pumps and plumbing, tiles, building materials, general hardware, home accessories, lighting and decor to homeowners, builders and businesses, deliver them across Uganda, and offer transportation and warehousing services to businesses and consumers.",
  disambiguatingDescription: DESCRIPTOR,
  slogan: TAGLINE,
  url: SITE,
  // Square logo, at least 112x112, on a solid background.
  logo: {
    "@type": "ImageObject",
    "@id": `${SITE}/#logo`,
    url: `${SITE}/icons/logo.png`,
    contentUrl: `${SITE}/icons/logo.png`,
    width: 1024,
    height: 1024,
    caption: NAME,
  },
  image: [`${SITE}/icons/logo-2048.png`, `${SITE}/icons/og-image-2x.png`],
  brand: {
    "@type": "Brand",
    name: NAME,
    alternateName: "FirstDepot",
    logo: `${SITE}/icons/logo.png`,
  },
  foundingDate: "2024-09-23",
  telephone: PHONE,
  email: EMAIL,
  currenciesAccepted: "UGX",
  paymentAccepted: "Mobile money, Bank card, Bank transfer",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Ojwina Road - Wigweng, Barogole, Lira City West",
    addressLocality: "Lira City",
    addressCountry: "UG",
    postOfficeBoxNumber: "332500",
  },
  areaServed: [{ "@type": "Country", name: "Uganda" }, ...deliveryCities],
  // company.hours: Monday to Saturday 8:00 am to 6:00 pm, Sunday 9:00 am to 5:00 pm
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "08:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "09:00",
      closes: "17:00",
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: PHONE,
      email: EMAIL,
      areaServed: "UG",
      availableLanguage: ["English"],
    },
    {
      "@type": "ContactPoint",
      contactType: "sales",
      description:
        "Trade desk: quotes, credit accounts and scheduled deliveries for contractors, builders and businesses",
      telephone: PHONE,
      email: EMAIL,
      areaServed: "UG",
      availableLanguage: ["English"],
    },
  ],
  // Official profiles (company.social). Google uses these to connect your
  // website to your brand. WhatsApp is not a profile page, so it is left out.
  sameAs: [
    "https://facebook.com/firstdepot",
    "https://instagram.com/firstdepot23",
    "https://x.com/firstdepot23",
    "https://tiktok.com/@firstdepot",
    "https://youtube.com/@firstdepot23",
  ],
  knowsAbout: [
    "Home improvement",
    "Hardware",
    "Paints and coatings",
    "Electricals",
    "Pumps and plumbing",
    "Tiles and flooring",
    "Building materials",
    "Hardware and tools",
    "Home accessories, lighting and decor",
    "Logistics and supply chain",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "First Depot products and services",
    itemListElement: [
      ...productFamilies.map((family) => ({
        "@type": "OfferCatalog",
        name: family.name,
        url: `${SITE}/docs/products#${family.id}`,
      })),
      ...services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          url: service.url,
          provider: { "@id": `${SITE}/#organization` },
          areaServed: { "@type": "Country", name: "Uganda" },
        },
      })),
    ],
  },
};

// Gives Google the name to show above your result. Spelling and capital
// letters here are what appears, so "First Depot", not "FIRST DEPOT".
const website = {
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: SITE,
  name: NAME,
  alternateName: ["FirstDepot", "First Depot Hardwares", "First Depot Uganda"],
  description: DESCRIPTOR,
  inLanguage: "en",
  publisher: { "@id": `${SITE}/#organization` },
};

// One graph, so the website and the company point at each other by @id.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [organization, website],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      // "<" is escaped so the data can never close the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
