import { company as c } from "./company";
import { p, ul, ol, table, note, type DocPage } from "./schema";

export const returns: DocPage = {
  slug: "return-and-refund-policy",
  title: "Return & Refund Policy",
  subtitle: "Changed your mind, or something is not right? Here is what we do",
  blurb: "returns, exchanges and refunds",
  group: "Policies",
  updated: "October 2026",
  numbered: true,
  intro: [
    p(
      `Home projects rarely go exactly to plan. If an item turns out to be wrong, faulty or simply not what you needed, we will make it right. This page explains how returns and refunds work at First Depot.`,
    ),
  ],
  sections: [
    {
      id: "summary",
      title: "The short version",
      blocks: [
        table(
          ["Situation", "Time to tell us", "What we do"],
          [
            "Damaged or faulty on arrival",
            "48 hours after delivery",
            "Free replacement or full refund",
          ],
          [
            "We sent the wrong item",
            "48 hours after delivery",
            "Free swap, or full refund including delivery",
          ],
          [
            "You changed your mind",
            "7 days after delivery",
            "Exchange or refund, item unused and in original packaging",
          ],
          [
            "Fault appears later",
            "Within the manufacturer's warranty",
            "We help you claim a repair, replacement or refund",
          ],
        ),
      ],
    },
    {
      id: "eligible",
      title: "What you can return",
      blocks: [
        p(`Most items can be returned if they are:`),
        ul(
          "unused, unopened and in their original packaging",
          "complete, with all parts, manuals and accessories",
          "accompanied by your receipt or order number",
        ),
        p(
          `Tools and fittings you have tried but not installed can usually be returned too, as long as they are clean and undamaged.`,
        ),
      ],
    },
    {
      id: "not-eligible",
      title: "What we cannot take back",
      blocks: [
        ul(
          "paint that has been tinted or mixed to a custom colour, unless it is faulty",
          "timber, pipes, cable and glass cut to your measurements",
          "opened electrical items, such as switches, breakers and bulbs, for safety reasons, unless faulty",
          "cement and other bagged materials that are opened, damaged or stored outdoors",
          "clearance items marked *final sale*",
        ),
      ],
    },
    {
      id: "how-to-return",
      title: "How to start a return",
      blocks: [
        ol(
          `Contact us at ${c.email.support}, on ${c.phone}, or on WhatsApp with your order number and a short description.`,
          "For damaged or wrong items, attach a photo. It helps us fix things faster.",
          "We will confirm the return and arrange either a pickup or a drop-off at our showroom.",
          "We inspect the item, usually within two working days of receiving it.",
        ),
      ],
    },
    {
      id: "refunds",
      title: "How refunds are paid",
      blocks: [
        p(
          `Refunds go back to the way you paid. Mobile money refunds normally arrive within 1 to 3 working days, and card refunds can take 5 to 10 working days depending on your bank. Bank transfer refunds are paid to the account you used.`,
        ),
        p(
          `If you paid with a store credit or voucher, we return the value to your account.`,
        ),
      ],
    },
    {
      id: "damaged",
      title: "Damaged or wrong items",
      blocks: [
        p(
          `Please check your goods at the door where you can. If something is damaged, note it on the delivery slip and tell us within 48 hours. We cover the cost of collecting the item and sending the replacement.`,
        ),
      ],
    },
    {
      id: "exchanges",
      title: "Exchanges",
      blocks: [
        p(
          `Want a different size, colour or model? We will swap it and settle any difference in price at the time. For paint, bring the tin and your receipt to the showroom so we can match the colour.`,
        ),
      ],
    },
    {
      id: "delivery-costs",
      title: "Delivery costs on returns",
      blocks: [
        p(
          `If the return is our fault, we pay for it. If you simply changed your mind, we deduct the original delivery fee and the cost of collecting the item, or you can drop it at our showroom at no cost.`,
        ),
        note(
          `Trade accounts may have different return terms set out in their agreement. Ask your account manager.`,
        ),
      ],
    },
  ],
};
