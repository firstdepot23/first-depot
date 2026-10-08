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
  whatsapp: "+256 781 905 753",
  whatsappHref: "https://wa.me/256781905753",
  address: "Plot 00, Ojwina Road, Lira city West, Lira, Uganda",
  hours: {
    weekdays: "Monday to Saturday, 8:00 am to 6:00 pm",
    sunday: "Sunday, 9:00 am to 5:00 pm",
    timezone: "East Africa Time",
  },
} as const;
