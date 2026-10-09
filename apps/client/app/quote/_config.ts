// Edit these to match the business. Nothing secret lives here.

export const CURRENCY = "UGX";

/**
 * Product.price in the database is divided by this to get whole currency
 * units. Use 1 if prices are stored as whole shillings, 100 if stored in
 * "cents". Check one product on the storefront against the quote page.
 */
export const PRICE_DIVISOR = 1;

/** Where customers are told to send photos, drawings and plans. */
export const PHOTO_CONTACT = {
  email: "notifications@first-depot.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com/firstdepot" },
    { label: "Facebook", href: "https://facebook.com/firstdepot" },
    { label: "WhatsApp", href: "https://wa.me/256700000001" },
  ],
} as const;

export const COMMON_UNITS = [
  "Pieces",
  "Bags",
  "Boxes",
  "Cartons",
  "Rolls",
  "Sheets",
  "Sets",
  "Pairs",
  "Meters",
  "Feet",
  "Liters",
  "Kilograms",
  "Tons",
  "Each",
] as const;
