// Structured data that tells Google who First Depot is. It feeds the logo in
// search results, the site name, and (once Google decides to show one) the
// company panel on the right of the results page.
// Keep every fact here identical to your Google Business Profile and social pages.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://first-depot.com";

const organization = {
  "@context": "https://schema.org",
  "@type": "HardwareStore",
  "@id": `${SITE}/#organization`,
  name: "First Depot",
  legalName: "First Depot Hardwares Limited",
  alternateName: ["FIRST DEPOT", "First Depot Hardwares"],
  description:
    "Home improvement company in Lira, Uganda. Paints, electricals, pumps and plumbing, tiles, building materials and general hardware, delivered to where the work is happening.",
  slogan: "Building comfort for your home",
  url: SITE,
  // Square logo, at least 112x112, on a solid background.
  logo: {
    "@type": "ImageObject",
    "@id": `${SITE}/#logo`,
    url: `${SITE}/icons/logo.png`,
    contentUrl: `${SITE}/icons/logo.png`,
    width: 1024,
    height: 1024,
    caption: "First Depot",
  },
  image: [`${SITE}/icons/logo-2048.png`, `${SITE}/icons/og-image-2x.png`],
  foundingDate: "2024-09-23",
  telephone: "+256781905753",
  email: "support@first-depot.com",
  priceRange: "UGX",
  currenciesAccepted: "UGX",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot 00, Ojwina Road - Wigweng, Barogole, Lira City West",
    addressLocality: "Lira City",
    addressCountry: "UG",
    postOfficeBoxNumber: "332500",
  },
  areaServed: { "@type": "Country", name: "Uganda" },
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
      telephone: "+256781905753",
      email: "support@first-depot.com",
      areaServed: "UG",
      availableLanguage: ["English"],
    },
  ],
  // Official profiles. Google uses these to connect your website to your brand.
  sameAs: [
    "https://wa.me/256781905753",
    "https://facebook.com/firstdepot",
    "https://instagram.com/firstdepot23",
    "https://x.com/firstdepot23",
    "https://tiktok.com/@firstdepot",
    "https://youtube.com/@firstdepot23",
  ],
  knowsAbout: [
    "Home improvement",
    "Paints and coatings",
    "Electricals",
    "Pumps and plumbing",
    "Tiles and flooring",
    "Building materials",
    "Hardware and tools",
  ],
};

// Gives Google the name to show above your result. Spelling and capital
// letters here are what appears, so "First Depot", not "FIRST DEPOT".
const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: SITE,
  name: "First Depot",
  alternateName: ["FIRST DEPOT", "First Depot Hardwares"],
  description: "Home improvement company",
  inLanguage: "en",
  publisher: { "@id": `${SITE}/#organization` },
};

const jsonLd = [organization, website];

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
