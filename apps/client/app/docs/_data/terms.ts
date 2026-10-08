import { company as c } from "./company";
import { p, ul, note, type DocPage } from "./schema";

export const terms: DocPage = {
  slug: "terms-of-service",
  title: "Terms of Service",
  subtitle: "The rules for shopping and working with First Depot",
  blurb: "the rules for using our store",
  group: "Policies",
  updated: "October 2026",
  numbered: true,
  intro: [
    p(
      `These terms are a plain-language agreement between you and ${c.legalName}. Please read them before you place an order. If something is unclear, [contact us](/docs/contacts) and we will explain.`,
    ),
  ],
  sections: [
    {
      id: "agreement",
      title: "Agreement to these terms",
      blocks: [
        p(
          `These terms apply to our website, our showroom, and our delivery and installation services (together, "First Depot"). By creating an account, placing an order or otherwise using First Depot, you agree to them.`,
        ),
        p(
          `If you are buying for a business, you confirm that you are allowed to bind that business to these terms. If you do not agree, please do not use First Depot.`,
        ),
      ],
    },
    {
      id: "account",
      title: "Your account",
      blocks: [
        p(
          `You need an account to place an order online. Give us accurate details and keep them up to date, because we use them for delivery, receipts and returns.`,
        ),
        p(
          `You are responsible for what happens under your account, so keep your sign-in details private and tell us straight away if you think someone else has used them. See [Security](/docs/security) for how to protect your account.`,
        ),
      ],
    },
    {
      id: "orders",
      title: "Orders, prices and availability",
      blocks: [
        p(
          `Prices are shown in Uganda shillings (UGX) and include VAT unless we say otherwise. Stock levels change quickly, so an order is only confirmed when you receive our confirmation message, not when you click "Place order" or "Checkout".`,
        ),
        p(`We may cancel or limit an order, and will refund you in full, if:`),
        ul(
          "the item is out of stock or no longer sold",
          "a price or description was clearly wrong",
          "we cannot verify your payment or delivery details",
          "the quantity looks like it is meant for resale and was not agreed with our trade desk",
        ),
      ],
    },
    {
      id: "payments",
      title: "Payments",
      blocks: [
        p(
          `You can pay by mobile money, bank card or bank transfer. Card and mobile money payments are handled by our licensed payment provider, so we never see or store your full card number or mobile money PIN.`,
        ),
        p(
          `An order moves from *pending* to *processing* once the payment provider confirms your payment. If a payment fails, nothing is charged and the order is marked *failed*. You can try again at any time.`,
        ),
      ],
    },
    {
      id: "delivery",
      title: "Delivery and risk",
      blocks: [
        p(
          `Delivery times and fees are listed in the [Help Center](/docs/help-center). Dates are estimates, not guarantees, and heavy weather or road closures can delay a truck.`,
        ),
        p(
          `Risk of loss or damage passes to you when the goods are handed over at your delivery address. Please check your delivery before the driver leaves and report anything wrong straight away, as set out in our [Return & Refund Policy](/docs/return-and-refund-policy).`,
        ),
      ],
    },
    {
      id: "trade",
      title: "Trade and bulk customers",
      blocks: [
        p(
          `Contractors, maintenance teams, construction companies and public bodies can apply for a trade account through our trade desk. Trade accounts may have negotiated prices, credit terms and delivery schedules, which are set out in a separate written agreement.`,
        ),
        p(
          `If a trade agreement conflicts with these terms, the trade agreement wins for that account.`,
        ),
      ],
    },
    {
      id: "product-safety",
      title: "Product information and safety",
      blocks: [
        p(
          `We take care to describe products accurately, but colours on a screen can differ from the real thing, especially paint. Ask for a tester pot before you buy a large quantity.`,
        ),
        p(
          `Electrical, pump and gas products must be installed by a suitably qualified person, and every product should be used as its manufacturer's instructions say. We are not responsible for loss caused by incorrect installation or misuse.`,
        ),
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        p(`When you use First Depot you agree not to:`),
        ul(
          "use the site to break any law or someone else's rights",
          "try to get into accounts, systems or data that are not yours",
          "scrape prices or listings in bulk, or overload our systems",
          "post false, misleading or abusive content, including in reviews",
        ),
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual property",
      blocks: [
        p(
          `The First Depot name, logo, product photos and website content belong to ${c.legalName} or its suppliers. You may view and print pages for your own personal use, but you may not copy or reuse them commercially without our written permission.`,
        ),
      ],
    },
    {
      id: "liability",
      title: "Our responsibility to you",
      blocks: [
        p(
          `We will do our best to supply goods of satisfactory quality that match their description. Nothing in these terms limits any right you have under Ugandan consumer law, or our liability for death or personal injury caused by our negligence, or for fraud.`,
        ),
        p(
          `Beyond that, and as far as the law allows, we are not liable for indirect losses such as lost profit or lost work caused by a delayed or unavailable order. Our total liability for any one order is limited to the price you paid for it.`,
        ),
      ],
    },
    {
      id: "law",
      title: "Governing law and disputes",
      blocks: [
        p(
          `These terms are governed by the laws of the Republic of Uganda. We would always rather fix a problem directly, so please [contact us](/docs/contacts) first. If we cannot resolve it, the courts of Uganda have jurisdiction.`,
        ),
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      blocks: [
        p(
          `We may update these terms from time to time. The date at the top shows when they last changed, and orders you have already placed stay under the terms that applied when you placed them.`,
        ),
        note(
          `Questions about these terms? Write to ${c.email.support} or call ${c.phone}.`,
        ),
      ],
    },
  ],
};
