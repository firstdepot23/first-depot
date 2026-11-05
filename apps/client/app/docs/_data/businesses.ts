import {
  company as c,
  gls as g,
  group,
  inc,
  businesses as list,
} from "./company";
import { p, h3, ul, table, note, type DocPage } from "./schema";

// Physical businesses vs. software and technology products.
const shopKinds: string[] = ["Retail", "Pharmacy", "Grocery"];

export const businesses: DocPage = {
  slug: "businesses",
  title: "Our Businesses",
  subtitle: "First Depot is a group of companies",
  blurb: "the companies and software behind First Depot",
  group: "Our Businesses",
  updated: "October 2026",
  intro: [
    p(
      `${inc.legalName} is ${inc.description} and the parent company of the First Depot group. It builds and runs the software, online store and systems used by three companies registered in Uganda: ${c.legalName}, OxPharm Health Limited and MD Clove. This page explains how the group is organized and what each part does.`,
    ),
  ],
  sections: [
    {
      id: "structure",
      title: "How the group is organized",
      blocks: [
        p(
          `**${group.parentName}** sits at the top. It is a technology company: it does not sell hardware, medicines or groceries itself. Instead it builds the products that the shops run on, and operates them for the group.`,
        ),
        p(
          `Three companies registered in Uganda run the physical businesses, each as its own legal entity: **${c.legalName}** (hardware and home improvement), **OxPharm Health Limited** (pharmacy) and **MD Clove** (groceries). New product lines, such as GLS, are run by ${group.parentName} and sit alongside them in the same group.`,
        ),
        note(group.note),
      ],
    },
    {
      id: "shops",
      title: "Our shops",
      blocks: [
        p(
          `The physical businesses, each a company registered in Uganda: hardware, pharmacy and groceries.`,
        ),
        table(
          ["Business", "Run by", "What it does", "Status"],
          ...list
            .filter((b) => shopKinds.includes(b.kind))
            .map((b) => [b.name, b.legalName, b.summary, b.statusLabel]),
        ),
      ],
    },
    {
      id: "tech-products",
      title: "Our software and technology products",
      blocks: [
        p(
          `The products ${inc.legalName} builds and runs itself, for the group's shops and for other businesses.`,
        ),
        table(
          ["Product", "Run by", "What it does", "Status"],
          ...list
            .filter((b) => !shopKinds.includes(b.kind))
            .map((b) => [b.name, b.legalName, b.summary, b.statusLabel]),
        ),
      ],
    },
    {
      id: "hardwares",
      title: "First Depot Hardwares",
      blocks: [
        p(
          `Our original business and the one most people know us for: a hardware and home improvement store, online and in our showroom. It is run by ${c.legalName}. Read more on the [About](/docs/about) page, or see its [Terms of Service](/docs/terms-of-service) and [Privacy Policy](/docs/privacy-policy).`,
        ),
      ],
    },
    {
      id: "oxpharm",
      title: "OxPharm Health",
      blocks: [
        p(
          `Our pharmacy, run by OxPharm Health Limited. It stocks health, wellness and care products, and is sold through the same online store as the rest of the group. See [Products](/docs/products) for what we stock.`,
        ),
      ],
    },
    {
      id: "mdclove",
      title: "MD Clove",
      blocks: [
        p(
          `Our grocery business: food, drinks and household essentials, also sold through the group's online store. See [Products](/docs/products) for what we stock.`,
        ),
      ],
    },
    {
      id: "technology",
      title: "The technology behind the shops",
      blocks: [
        p(
          `${inc.legalName} builds and operates the online store, the ordering and delivery systems, and the sales and stock software that the three shops run on. Because one team runs the technology, a customer can shop hardware, groceries and pharmacy items from the same place, with one account and one checkout.`,
        ),
      ],
    },
    {
      id: "gls",
      title: "GLS",
      blocks: [
        p(
          `GLS (General Ledger System) is the sales and accounting software we built to run First Depot Hardwares: point of sale, stock, and the general ledger behind both. It is run by ${inc.legalName}, and we have opened it up so other retail and trade businesses can run it too.`,
        ),
        p(
          `GLS has its own page and its own policies, because it serves a different kind of customer in a different way: see [GLS](/docs/gls), its [Terms of Service](/docs/gls-terms-of-service) and its [Privacy Policy](/docs/gls-privacy-policy).`,
        ),
      ],
    },
    {
      id: "pay",
      title: "First Depot Pay",
      blocks: [
        p(
          `A planned payment gateway. It would first handle payments for the group's shops and GLS billing, then open up to other merchants. We will publish its own Terms of Service and Privacy Policy before it launches.`,
        ),
        note(
          `Until then, the online store takes payments through ${c.paymentProvider}, and GLS billing runs through ${g.paymentProvider}.`,
        ),
      ],
    },
    {
      id: "supply-chain",
      title: "First Depot Supply Chain",
      blocks: [
        p(
          `A planned software platform for the transportation and warehousing services we already provide (see [Products](/docs/products)). The goal is to let other businesses plan, book and track deliveries the way we already do internally.`,
        ),
      ],
    },
    {
      id: "why-different-policies",
      title: "Why GLS has its own policies",
      blocks: [
        h3("Different customers, different data"),
        p(
          `When you shop with us online, you are buying goods from one of our Ugandan companies. GLS is software that a business runs, holding that business's own sales records, stock and customers. A payment gateway and a supply chain platform would each handle money or logistics data in their own way again.`,
        ),
        p(
          `Rather than stretch one policy to cover all of that, each product publishes its own Terms of Service and Privacy Policy, written for what it actually does and who it actually serves. If you only ever shop with us, the store's [Terms of Service](/docs/terms-of-service) and [Privacy Policy](/docs/privacy-policy) are the ones that apply to you.`,
        ),
        ul(
          "**Online store** (hardware, pharmacy and groceries) - [Terms of Service](/docs/terms-of-service), [Privacy Policy](/docs/privacy-policy)",
          "**GLS** - [Terms of Service](/docs/gls-terms-of-service), [Privacy Policy](/docs/gls-privacy-policy)",
        ),
      ],
    },
  ],
};