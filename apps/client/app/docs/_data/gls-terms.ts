import { company as c, gls as g } from "./company";
import { p, ul, note, type DocPage } from "./schema";

// SAMPLE TERMS - written to show how GLS's agreement differs in shape from
// the hardware store's (terms.ts): it's a subscription agreement with a
// business, not a sale of goods to a shopper. Have a lawyer review this
// before it is used for a real GLS customer.

export const glsTerms: DocPage = {
  slug: "gls-terms-of-service",
  title: "GLS Terms of Service",
  subtitle: "The agreement for businesses using GLS",
  blurb: "the rules for running GLS",
  group: "GLS",
  updated: "October 2026",
  numbered: true,
  intro: [
    note(
      `This is a sample agreement for discussion, not legal advice. Have a lawyer review it before it is used with a real GLS customer.`,
    ),
    p(
      `These terms are a separate agreement from the [First Depot Hardwares Terms of Service](/docs/terms-of-service). They apply when a business (**"you"**) signs up to run GLS, not when you shop with us for hardware.`,
    ),
  ],
  sections: [
    {
      id: "the-service",
      title: "The service",
      blocks: [
        p(
          `GLS is software, provided by ${g.legalName} ("GLS", "we", "us"), that lets your business record sales, track stock and keep a general ledger, accessed through ${g.website} or an app we provide.`,
        ),
      ],
    },
    {
      id: "accounts",
      title: "Your account",
      blocks: [
        p(
          `One person at your business sets up the account as the admin and can add other users (your staff) under it. You are responsible for what your users do with GLS, and for keeping their sign-in details private.`,
        ),
      ],
    },
    {
      id: "subscription",
      title: "Subscription and fees",
      blocks: [
        p(
          `GLS is offered on Starter, Business and Enterprise plans, billed monthly or yearly - see current plans and prices at [${g.pricingUrl.replace("https://", "")}](${g.pricingUrl}). The subscription is billed to your organisation as a whole and covers every user you add, up to your plan's limit. We will tell you before any price change takes effect, and you can cancel rather than accept it.`,
        ),
        p(
          `Subscription payments are handled by ${g.paymentProvider}, our payment processor, on its own secure pages. We do not see or store your full card details.`,
        ),
        p(
          `If your subscription lapses, access to GLS pauses for your organisation until it is renewed. We do not delete your data for a lapsed subscription - see [Your business data](#your-data) below and the [GLS Privacy Policy](/docs/gls-privacy-policy) for how long we keep it.`,
        ),
      ],
    },
    {
      id: "your-data",
      title: "Your business data",
      blocks: [
        p(
          `The sales, stock, ledger entries and customer records you put into GLS belong to your business. We process them only to provide the service to you, and as described in the [GLS Privacy Policy](/docs/gls-privacy-policy) - not for our own purposes.`,
        ),
        ul(
          "You can export your data from GLS at any time.",
          "If you close your account, we keep a copy for a limited period in case you need it back, then delete it - see the Privacy Policy for how long.",
        ),
      ],
    },
    {
      id: "availability",
      title: "Availability and maintenance",
      blocks: [
        p(
          `We aim to keep GLS available at all times, but like any software it can have downtime, including for planned maintenance. We will try to schedule maintenance outside normal business hours and tell you in advance where we can. Paid plans may come with a separate service-level commitment, set out in your order form.`,
        ),
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        p(`When using GLS, you agree not to:`),
        ul(
          "use it to store or process data you do not have the right to hold",
          "try to access another business's account or data",
          "attempt to disrupt, scan or overload our systems",
          "resell or provide access to GLS to a third party without our agreement",
        ),
      ],
    },
    {
      id: "termination",
      title: "Ending the agreement",
      blocks: [
        p(
          `You can cancel your subscription at any time; it ends at the close of your current billing period. We can suspend or end an account that breaches these terms, or that we reasonably believe puts other customers or our systems at risk, and we will tell you why.`,
        ),
      ],
    },
    {
      id: "liability",
      title: "Our responsibility to you",
      blocks: [
        p(
          `We will do our best to keep GLS working correctly and your data safe. As far as the law allows, our total liability to you under this agreement is limited to the fees you paid us in the three months before the claim, and we are not liable for indirect losses such as lost profit. Nothing here limits liability that cannot be limited by law, such as for fraud.`,
        ),
      ],
    },
    {
      id: "law",
      title: "Governing law",
      blocks: [
        p(
          `These terms are governed by the laws of the Republic of Uganda. Please [contact us](mailto:${g.email.support}) first if something is wrong; if we cannot resolve it, the courts of Uganda have jurisdiction.`,
        ),
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      blocks: [
        p(
          `We may update these terms as GLS changes. We will tell active customers of any significant change before it takes effect.`,
        ),
        note(`Questions about these terms: ${g.email.support}. This page belongs to ${c.name}'s GLS product and is separate from the hardware store's policies.`),
      ],
    },
  ],
};