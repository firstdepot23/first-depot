import { gls as g } from "./company";
import { p, ul, table, note, type DocPage } from "./schema";

// Mirrors GLS's own apps/gls/lib/plan.ts. This is display copy only - the
// docs reader and the GLS app are separate codebases, so this can't import
// that file directly. Keep it in sync by hand when plans or prices change,
// the same way plan.ts itself asks you to keep its prices in sync with
// Stripe.
const PLANS = [
  {
    name: "Starter",
    price: "$5/mo (or $55/yr)",
    includes:
      "Up to 3 users, inventory/sales/purchases, dashboard & expense tracking, email support",
  },
  {
    name: "Business",
    price: "$8/mo (or $88/yr)",
    includes:
      "Up to 50 users, everything in Starter, business reports, full accounting (cash book, trial balance, financial statements), analytics, multi-branch inventory, priority support",
  },
  {
    name: "Enterprise",
    price: "Custom",
    includes:
      "Unlimited users, everything in Business, dedicated onboarding, custom integrations",
  },
];

export const glsDoc: DocPage = {
  slug: "gls",
  title: g.name,
  subtitle: g.tagline,
  blurb: "the software behind First Depot",
  group: "GLS",
  updated: "October 2026",
  intro: [
    p(
      `GLS, short for General Ledger System, is the software we built to run First Depot Hardwares: sales, stock and accounting in one place. We are now preparing GLS so other businesses can run it too, at [${g.website.replace("https://", "")}](${g.website}).`,
    ),
  ],
  sections: [
    {
      id: "what-it-does",
      title: "What GLS does",
      blocks: [
        ul(
          "**Point of sale.** Record sales in the showroom or online, by cash, mobile money or card.",
          "**Stock.** Track what is in the warehouse, what has been sold, and what needs reordering.",
          "**General ledger.** The accounting entries behind every sale, purchase and payment, kept consistent automatically.",
          "**Customers and orders.** A history of who bought what, so repeat customers and trade accounts are easy to serve.",
          "**Reporting.** Daily sales, stock levels and basic financial reports, without needing a separate spreadsheet.",
        ),
      ],
    },
    {
      id: "who-its-for",
      title: "Who it's for",
      blocks: [
        p(
          `GLS currently runs First Depot Hardwares' own sales and stock, every day. We are opening it up to other retail and trade businesses that want the same kind of tool, without having to build it themselves.`,
        ),
      ],
    },
    {
      id: "plans",
      title: "Plans and pricing",
      blocks: [
        table(
          ["Plan", "Price", "Includes"],
          ...PLANS.map((plan) => [plan.name, plan.price, plan.includes]),
        ),
        note(
          `Prices are in USD and billed to your organisation, covering all of its users up to the plan's limit. See the current numbers and subscribe at [${g.pricingUrl.replace("https://", "")}](${g.pricingUrl}).`,
        ),
      ],
    },
    {
      id: "subscription-model",
      title: "How the subscription works",
      blocks: [
        p(
          `One administrator signs the organisation up and manages billing from GLS's own billing settings. The subscription is billed to the organisation, not to individual users, and it covers every user added under it, up to the plan's limit.`,
        ),
        p(
          `If an organisation's subscription lapses, access pauses until it's renewed - your data is kept, not deleted. See the [GLS Terms of Service](/docs/gls-terms-of-service) for the full detail.`,
        ),
      ],
    },
    {
      id: "availability",
      title: "Availability",
      blocks: [
        table(
          ["Use", "Status"],
          ["Internal use at First Depot Hardwares", "Operating"],
          ["Sign-up for other businesses", "Open"],
        ),
        p(
          `Sign up directly at [${g.registerUrl.replace("https://", "")}](${g.registerUrl}), or write to [${g.email.sales}](mailto:${g.email.sales}) with questions first.`,
        ),
      ],
    },
    {
      id: "policies",
      title: "Policies",
      blocks: [
        p(
          `GLS has its own [Terms of Service](/docs/gls-terms-of-service) and [Privacy Policy](/docs/gls-privacy-policy), separate from the hardware store's. GLS holds a business's own sales and customer records on its behalf, which is a different relationship than selling someone a tin of paint, so it needed its own documents rather than a stretch of the retail ones.`,
        ),
        note(
          `If you only shop with First Depot Hardwares, these GLS documents do not apply to you - see the store's [Terms of Service](/docs/terms-of-service) and [Privacy Policy](/docs/privacy-policy) instead.`,
        ),
      ],
    },
    {
      id: "support",
      title: "Getting help",
      blocks: [
        p(
          `Questions about using GLS: [${g.email.support}](mailto:${g.email.support}). Sales and early access: [${g.email.sales}](mailto:${g.email.sales}).`,
        ),
      ],
    },
  ],
};