import { company as c } from "./company";
import { p, ul, table, note, type DocPage } from "./schema";

export const contacts: DocPage = {
  slug: "contacts",
  title: "Contacts",
  subtitle: "Real people, ready to help",
  blurb: "how to reach us",
  group: "Company",
  updated: "October 2026",
  intro: [
    p(
      `Whether you are choosing paint, chasing a delivery or planning a build, we would like to hear from you. Pick the channel that suits you best.`,
    ),
  ],
  sections: [
    {
      id: "customer-support",
      title: "Customer support",
      blocks: [
        ul(
          `Phone: [${c.phone}](tel:${c.phoneHref})`,
          `WhatsApp: [${c.whatsapp}](${c.whatsappHref})`,
          `Email: [${c.email.support}](mailto:${c.email.support})`,
        ),
        p(
          `Have your order number ready and we can usually answer straight away. We reply to emails within one working day.`,
        ),
      ],
    },
    {
      id: "showroom",
      title: "Showroom and pickup",
      blocks: [
        p(c.address),
        table(
          ["Day", "Hours"],
          ["Monday to Saturday", "8:00 am to 6:00 pm"],
          ["Sunday", "10:00 am to 4:00 pm"],
          ["Public holidays", "Check our WhatsApp status"],
        ),
        note(`All times are ${c.hours.timezone}.`),
      ],
    },
    {
      id: "trade-desk",
      title: "Trade and bulk orders",
      blocks: [
        p(
          `Contractors, builders and businesses can reach our trade desk for quotes, credit accounts and scheduled deliveries.`,
        ),
        ul(`Email: [${c.email.trade}](mailto:${c.email.trade})`, `Phone: [${c.phone}](tel:${c.phoneHref}), ask for the trade desk`),
      ],
    },
    {
      id: "privacy-security",
      title: "Privacy and security",
      blocks: [
        ul(
          `Privacy requests: [${c.email.privacy}](mailto:${c.email.privacy})`,
          `Security reports: [${c.email.security}](mailto:${c.email.security})`,
        ),
        p(
          `See our [Privacy Policy](/docs/privacy-policy) and [Security](/docs/security) pages for details.`,
        ),
      ],
    },
    {
      id: "partners",
      title: "Suppliers and partnerships",
      blocks: [
        p(
          `Manufacturers, distributors and service providers who would like to work with us can write to [${c.email.partners}](mailto:${c.email.partners}) with a short introduction and a product list.`,
        ),
      ],
    },
    {
      id: "feedback",
      title: "Feedback and complaints",
      blocks: [
        p(
          `If we got something wrong, please tell us. Write to [${c.email.support}](mailto:${c.email.support}) with the subject *Feedback*. A manager will review it and respond within three working days.`,
        ),
      ],
    },
  ],
};
