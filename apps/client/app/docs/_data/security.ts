import { company as c } from "./company";
import { p, ul, ol, note, type DocPage } from "./schema";

export const security: DocPage = {
  slug: "security",
  title: "Security",
  subtitle: "How we protect your account, your payments and your data",
  blurb: "how we keep you and your data safe",
  group: "Help and safety",
  updated: "October 2026",
  intro: [
    p(
      `You trust us with your contact details, your orders and your payments. This page explains the protections we have in place and the steps you can take to stay safe.`,
    ),
  ],
  sections: [
    {
      id: "approach",
      title: "Our approach",
      blocks: [
        p(
          `We collect as little personal information as we can, restrict who can see it, and use well-established services for the sensitive parts, such as sign-in and payments, instead of building them ourselves.`,
        ),
      ],
    },
    {
      id: "your-account",
      title: "Protecting your account",
      blocks: [
        ul(
          "Use a long, unique password that you do not use anywhere else.",
          "Turn on two-step verification in your account settings.",
          "Sign out on shared or public devices.",
          "Tell us straight away if you notice an order or sign-in you do not recognise.",
        ),
      ],
    },
    {
      id: "payments",
      title: "Payment security",
      blocks: [
        p(
          `Payments are processed by a licensed payment provider on its own secure pages. Your card number and mobile money PIN go straight to them and never pass through, or sit on, our servers. We only receive a payment status and a reference so we can match it to your order.`,
        ),
      ],
    },
    {
      id: "data",
      title: "Data protection",
      blocks: [
        ul(
          "Data is encrypted in transit using HTTPS.",
          "Databases are access-controlled and backed up regularly.",
          "Staff only see the information they need for their job.",
          "Access to production systems is logged and reviewed.",
        ),
        p(
          `Read how we handle personal information in the [Privacy Policy](/docs/privacy-policy).`,
        ),
      ],
    },
    {
      id: "scams",
      title: "Avoiding scams",
      blocks: [
        p(
          `Criminals sometimes pretend to be shops to get money or PINs. Remember:`,
        ),
        ul(
          "First Depot will never ask for your mobile money PIN, card PIN or one-time code.",
          "We will never ask you to pay into a personal mobile money number or personal bank account.",
          "Only pay through our website checkout or to the official details shown on your invoice.",
          `If you are unsure, call us on ${c.phone} before paying.`,
        ),
      ],
    },
    {
      id: "disclosure",
      title: "Reporting a vulnerability",
      blocks: [
        p(
          `If you believe you have found a security problem in our website or systems, please tell us before telling anyone else. Email [${c.email.security}](mailto:${c.email.security}) with:`,
        ),
        ol(
          "a description of the issue and where you found it",
          "the steps needed to reproduce it",
          "your contact details, so we can follow up",
        ),
        p(
          `We will acknowledge your report within three working days and keep you informed. Please do not access other people's data, disrupt the service or publish details until we have had a chance to fix it.`,
        ),
      ],
    },
    {
      id: "incidents",
      title: "If something goes wrong",
      blocks: [
        p(
          `If an incident affects your information, we will investigate quickly, contain it, and tell you and the relevant authorities without undue delay, explaining what happened and what you should do.`,
        ),
        note(`Security contact: ${c.email.security}`),
      ],
    },
  ],
};
