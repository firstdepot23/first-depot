import { businesses, company as c, inc } from "./company";
import { p, ul, table, note, type DocPage } from "./schema";

export const privacy: DocPage = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  subtitle: "What we collect, why we collect it, and the choices you have",
  blurb: "how we handle your information",
  group: "Policies",
  updated: "October 2026",
  numbered: true,
  intro: [
    note(
      `${inc.legalName} is a Delaware technology company behind the retail business of it's subsidaries; ${c.legalName}, OxPharm Health Limited & MD Clove`,
    ),
    p(
      `We only collect the information we need to sell you hardware, groceries and pharmacy products, deliver them, and look after you afterwards. This policy explains what that is and how we protect it. We follow the Data Protection and Privacy Act, 2019 of Uganda.`,
    ),
  ],
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        p(
          `The First Depot online store is run by ${inc.legalName}, ${inc.description}, for three companies registered in Uganda: ${c.legalName}, OxPharm Health Limited and MD Clove. When you order from one of them, that company is the data controller for the personal information described here. ${inc.legalName} runs the store and its systems on their behalf. In this policy, "First Depot", "we" and "us" mean these companies together.`,
        ),
        p(
          `The address of ${c.legalName} is ${c.address}.`,
        ),
        p(
          `Our data protection contact is reachable at [${c.email.privacy}](mailto:${c.email.privacy}).`,
        ),
      ],
    },
    {
      id: "what-we-collect",
      title: "Information we collect",
      blocks: [
        table(
          ["Type", "Examples", "Why we need it"],
          [
            "Account details",
            "Name, email address, phone number",
            "To create your account and contact you about orders",
          ],
          [
            "Order details",
            "Items, quantities, delivery address, order history",
            "To fulfil, deliver and support your purchases",
          ],
          [
            "Payment information",
            "Payment status and reference (not your card number or PIN)",
            "To confirm payment and issue refunds",
          ],
          [
            "Trade information",
            "Business name, tax number, site addresses",
            "To set up and manage trade accounts",
          ],
          [
            "Device and usage data",
            "Browser type, pages viewed, approximate location",
            "To keep the site secure and improve it",
          ],
        ),
        p(
          `You can also give us information directly, for example when you write to our support team or leave a review.`,
        ),
        p(
          `Pharmacy orders can reveal something about your health. We treat that information with extra care and use it only to prepare and deliver your order and to look after you afterwards.`,
        ),
      ],
    },
    {
      id: "how-we-use-it",
      title: "How we use your information",
      blocks: [
        ul(
          "to process your orders, arrange delivery and handle returns",
          "to send order confirmations, delivery updates and receipts",
          "to answer your questions and resolve problems",
          "to prevent fraud and keep our systems safe",
          "to improve our range, prices and website",
          "to send offers and news, only if you have opted in",
        ),
        p(`We do not sell your personal information to anyone.`),
      ],
    },
    {
      id: "sharing",
      title: "Who we share it with",
      blocks: [
        p(
          `We share information only with people who need it to serve you, and only what they need:`,
        ),
        ul(
          `**Other companies in the First Depot group.** The company you ordered from, and ${inc.legalName}, which runs the store and its systems.`,
          "**Payment provider.** To take and confirm your payment.",
          "**Delivery partners.** Your name, phone number and address, so your goods arrive.",
          "**Service providers.** Hosting, email and customer-support tools that work on our behalf under contract.",
          "**Authorities.** When the law requires it, or to protect our customers and staff.",
        ),
      ],
    },
    {
      id: "transfers",
      title: "Where your information is stored",
      blocks: [
        p(
          `Because ${inc.legalName} is based in the United States and our hosting providers may be outside Uganda, your information may be processed outside Uganda. Where that happens, we require the same level of protection and only use providers bound by contract to protect it.`,
        ),
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      blocks: [
        p(
          `We use a small number of cookies to keep you signed in, remember your basket and understand how the site is used. You can block cookies in your browser settings, but parts of the site, such as checkout, may stop working.`,
        ),
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      blocks: [
        p(
          `We keep order and payment records for as long as the law requires for tax and accounting, which is normally several years. Account information is kept while your account is open, and we delete or anonymise it within a reasonable time after you close it.`,
        ),
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      blocks: [
        p(`You can ask us at any time to:`),
        ul(
          "tell you what personal information we hold about you",
          "correct anything that is wrong or out of date",
          "delete your information, where we are not required to keep it",
          "stop using your information for marketing",
          "object to, or restrict, certain uses of your information",
        ),
        p(
          `Write to [${c.email.privacy}](mailto:${c.email.privacy}). We will answer within 30 days. If you are not happy with our response, you can complain to the Personal Data Protection Office in Uganda.`,
        ),
      ],
    },
    {
      id: "security",
      title: "Keeping it safe",
      blocks: [
        p(
          `We protect personal information with encryption in transit, restricted access and regular backups. You can read more on our [Security](/docs/security) page.`,
        ),
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: [
        p(
          `First Depot is not meant for people under 18, and we do not knowingly collect their information. If you think a child has given us personal information, tell us and we will delete it.`,
        ),
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        p(
          `We will update this page when our practices change and show the new date at the top. For big changes we will also tell you by email.`,
        ),
        note(`Privacy questions: ${c.email.privacy}`),
      ],
    },
  ],
};