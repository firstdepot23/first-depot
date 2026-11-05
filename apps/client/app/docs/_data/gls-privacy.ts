import { gls as g } from "./company";
import { p, ul, table, note, type DocPage } from "./schema";

// SAMPLE PRIVACY POLICY - the key difference from privacy.ts (the hardware
// store's) is the controller/processor split: GLS mostly holds a business
// customer's OWN records, which it processes on that business's behalf
// rather than for itself. Have a lawyer review this before real use.

export const glsPrivacy: DocPage = {
  slug: "gls-privacy-policy",
  title: "GLS Privacy Policy",
  subtitle: "How GLS handles your account, and the business data you put into it",
  blurb: "how GLS handles your data",
  group: "GLS",
  updated: "October 2026",
  numbered: true,
  intro: [
    note(
      `This is a sample policy for discussion, not legal advice. Have a lawyer review it before it is used with a real GLS customer.`,
    ),
    p(
      `This is a separate policy from the [First Depot Hardwares Privacy Policy](/docs/privacy-policy). It covers GLS, the software a business runs to manage its own sales, stock and ledger.`,
    ),
  ],
  sections: [
    {
      id: "two-roles",
      title: "Two different roles",
      blocks: [
        p(
          `GLS handles two kinds of information, and we play a different role for each:`,
        ),
        table(
          ["Information", "Our role", "What that means"],
          [
            "Your business account (who signed up, billing contact, users)",
            "Controller",
            "We decide why we collect it and are responsible for it under this policy.",
          ],
          [
            "Records you put into GLS (your sales, stock, ledger, your own customers)",
            "Processor",
            "It belongs to your business. We only process it on your instructions, to provide the service.",
          ],
        ),
        p(
          `If GLS is used by one of your employees or customers and they have a question about data in your records, they should ask your business - we act on your instructions, not theirs.`,
        ),
      ],
    },
    {
      id: "account-data",
      title: "Information about your account",
      blocks: [
        p(`As controller, we collect:`),
        ul(
          "the business name, admin name, email and phone number used to sign up",
          "the user accounts your admin creates for staff",
          "billing details and subscription history",
          "basic usage and device data, to keep GLS secure and working well",
        ),
      ],
    },
    {
      id: "your-records",
      title: "Records you put into GLS",
      blocks: [
        p(
          `As processor, GLS stores whatever your business enters: sales, stock, ledger entries, and details of your own customers. We only use it to run GLS for you. We do not use it for our own marketing, and we do not sell it. We may look at aggregated, anonymized patterns across customers (for example, "how many sales a typical account records per day") to improve GLS, never at your specific records for our own purposes.`,
        ),
      ],
    },
    {
      id: "sub-processors",
      title: "Who else handles this data",
      blocks: [
        p(
          `We use a small number of service providers to run GLS, under contract and only for the purposes described here. We do not share your records with anyone else, except where the law requires it.`,
        ),
        ul(
          `**${g.paymentProvider}** - processes your subscription payments. We do not see or store your full card details.`,
          "Hosting and backup providers that store GLS data securely.",
        ),
      ],
    },
    {
      id: "security",
      title: "Keeping it safe",
      blocks: [
        ul(
          "Each business's data is kept separate from every other business's.",
          "Data is encrypted in transit.",
          "Access by our staff is limited to what is needed to support you, and logged.",
          "Backups are taken regularly.",
        ),
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      blocks: [
        p(
          `As the business running GLS, you can ask us at any time to export your records, correct your account details, or delete your account. Write to [${g.email.privacy}](mailto:${g.email.privacy}).`,
        ),
        p(
          `If you are a customer or employee of a business that uses GLS, and you have a question about your own information inside their records, please contact that business directly - they control that data, not us.`,
        ),
      ],
    },
    {
      id: "retention",
      title: "How long we keep it",
      blocks: [
        p(
          `We keep your records for as long as your subscription is active. After you close your account, we keep a copy for a limited period so you can request it back, then delete it, unless the law requires us to keep it longer.`,
        ),
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        p(
          `We will update this page when our practices change, and tell active customers of any significant change.`,
        ),
        note(`Privacy questions about GLS: ${g.email.privacy}`),
      ],
    },
  ],
};