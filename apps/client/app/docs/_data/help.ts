import {
  DELIVERY_CITIES,
  DELIVERY_CITY_INFO,
  PICKUP_STATION,
} from "@repo/types";
import { company as c } from "./company";
import { p, h3, ul, table, note, type DocPage } from "./schema";

// Delivery fees come from the same list the cart and checkout use
// (packages/types/src/cart.ts), so this page can never disagree with what
// customers are charged.
const ugx = (amount: number) => `UGX ${amount.toLocaleString("en-US")}`;

export const help: DocPage = {
  slug: "help-center",
  title: "Help Center",
  subtitle: "Answers to the questions we hear most",
  blurb: "answers to common questions",
  group: "Help and safety",
  updated: "October 2026",
  intro: [
    p(
      `Find a quick answer below. If you cannot find what you need, our team is happy to help. See [Contacts](/docs/contacts).`,
    ),
  ],
  sections: [
    {
      id: "ordering",
      title: "Ordering",
      blocks: [
        h3("How do I place an order?"),
        p(
          `Add items to your cart, choose pickup or delivery, and pay. You will get a confirmation message once your order is accepted, and updates as it is prepared and delivered.`,
        ),
        h3("Can I change or cancel an order?"),
        p(
          `Yes, as long as it has not left our warehouse. Contact us as soon as possible with your order number and we will update or cancel it.`,
        ),
        h3("Why was my order cancelled?"),
        p(
          `The usual reasons are that an item sold out, or that a payment could not be confirmed. We always refund in full and tell you why. See the [Terms of Service](/docs/terms-of-service).`,
        ),
      ],
    },
    {
      id: "payments",
      title: "Payments",
      blocks: [
        h3("Which payment methods do you accept?"),
        p(`Mobile money, bank cards and bank transfer. Trade accounts can also arrange invoice terms.`),
        h3("My payment failed. Was I charged?"),
        p(
          `If an order shows as *failed*, no money has been taken. If you were charged and the order still shows as failed, contact us with your payment reference and we will sort it out.`,
        ),
        h3("Can I get a receipt or invoice?"),
        p(`Yes. Receipts are emailed automatically, and you can ask for a tax invoice with your business details.`),
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      blocks: [
        p(
          `At checkout you choose how to get your order: collect it from our station for free, or have it delivered to your address in any city in Uganda. Delivery is charged per city, and the fee is added to your total before you pay.`,
        ),
        table(
          ["Where", "Estimated time", "Fee"],
          [
            `Pickup from our station (${PICKUP_STATION.city})`,
            "Ready within a few hours",
            "Free",
          ],
          ...DELIVERY_CITIES.map((key) => [
            DELIVERY_CITY_INFO[key].label,
            DELIVERY_CITY_INFO[key].eta,
            ugx(DELIVERY_CITY_INFO[key].fee),
          ]),
        ),
        note(
          `Delivery fees are fixed per city, based on the distance from our dispatch point in Lira. Heavy loads, such as cement and iron sheets, may cost more because they are priced by weight and distance. If that applies to your order, we will call you before dispatch.`,
        ),
        h3("Can I collect my order?"),
        p(
          `Yes, and it is free. Choose *Pick up from our station* at checkout and we will message you when it is ready, usually within a few hours. Our station is at ${PICKUP_STATION.address}, ${PICKUP_STATION.city}.`,
        ),
        h3("My town is not on the list."),
        p(
          `Choose *Other town in Uganda* at checkout and type your town. It uses the standard fee shown above, and we will tell you if your location needs a different quote.`,
        ),
      ],
    },
    {
      id: "returns",
      title: "Returns and refunds",
      blocks: [
        h3("How long do I have to return something?"),
        p(
          `Tell us within 48 hours if something arrives damaged or wrong, and within 7 days if you changed your mind. Full details are in the [Return & Refund Policy](/docs/return-and-refund-policy).`,
        ),
        h3("When will I get my refund?"),
        p(`Mobile money refunds usually arrive in 1 to 3 working days, and card refunds in 5 to 10.`),
      ],
    },
    {
      id: "account",
      title: "Your account",
      blocks: [
        h3("I forgot my password."),
        p(`Choose *Manage Account* on the sign-in page and follow the details.`),
        h3("How do I delete my account?"),
        p(`Email [${c.email.privacy}](mailto:${c.email.privacy}) from the address on your account. See the [Privacy Policy](/docs/privacy-policy) for what we keep and why.`),
      ],
    },
    {
      id: "trade",
      title: "Trade accounts",
      blocks: [
        h3("Who can open a trade account?"),
        p(`Contractors, maintenance teams, construction companies, property managers and public bodies. Email [${c.email.trade}](mailto:${c.email.trade}) with your business details.`),
        h3("Do you offer bulk discounts?"),
        p(`Yes. Send us a bill of quantities or a list of what you need and we will quote you.`),
      ],
    },
    {
      id: "advice",
      title: "Product advice",
      blocks: [
        h3("How much paint do I need?"),
        p(
          `As a rough guide, one litre of emulsion covers about 10 to 12 square metres per coat. Measure the width and height of each wall, subtract doors and windows, multiply by the number of coats, and divide by the coverage. Our staff can check your sums in the showroom.`,
        ),
        h3("Can you help choose the right pump or cable?"),
        p(
          `Yes. Tell us what you are powering or pumping and the distance involved, and we will recommend suitable sizes. For installation, always use a qualified electrician or plumber.`,
        ),
        ul(
          "Bring a photo or measurements to the showroom",
          "Call or message us on WhatsApp with your question",
        ),
      ],
    },
  ],
};
