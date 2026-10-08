import { company as c } from "./company";
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
    p(
      `We only collect the information we need to sell you hardware, deliver it, and look after you afterwards. This policy explains what that is and how we protect it. We follow the Data Protection and Privacy Act, 2019 of Uganda.`,
    ),
  ],
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        p(
          `${c.legalName} ("First Depot", "we", "us") is the data controller for the personal information described here. Our address is ${c.address}.`,
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
          "**Payment provider.** To take and confirm your payment.",
          "**Delivery partners.** Your name, phone number and address, so your goods arrive.",
          "**Service providers.** Hosting, email and customer-support tools that work on our behalf under contract.",
          "**Authorities.** When the law requires it, or to protect our customers and staff.",
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
