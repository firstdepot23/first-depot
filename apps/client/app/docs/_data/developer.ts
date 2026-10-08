import { company as c } from "./company";
import { p, code, table, note, type DocPage } from "./schema";

// Illustrative API reference. Replace the base URL, routes and payloads with
// your real service before publishing.

export const developer: DocPage = {
  slug: "developer",
  title: "Developer",
  subtitle: "Build on top of First Depot",
  blurb: "API reference for partners",
  group: "Build and shop",
  updated: "October 2026",
  intro: [
    p(
      `The First Depot API lets approved partners read our product catalogue, place orders on behalf of customers and receive payment updates. It is a JSON REST API.`,
    ),
    p(`Base URL: \`${c.apiBase}\``),
  ],
  sections: [
    {
      id: "authentication",
      title: "Authentication",
      blocks: [
        p(
          `Create an API key in your account under *Developer settings*. Send it as a bearer token with every request. Keys starting with \`fd_test_\` work in the sandbox, and keys starting with \`fd_live_\` work in production.`,
        ),
        code(`
curl ${c.apiBase}/products \\
  -H "Authorization: Bearer $FIRST_DEPOT_KEY"
`),
        note(`Keep keys secret. Never put a live key in a mobile app or in browser code.`),
      ],
    },
    {
      id: "products",
      title: "Products",
      blocks: [
        p(
          `List the catalogue, optionally filtered by category. Results are paginated with \`limit\` and \`cursor\`.`,
        ),
        code(`GET /products?category=paints&limit=2`),
        code(`
{
  "data": [
    {
      "sku": "PNT-EMU-20L-WHT",
      "name": "Interior Emulsion, White, 20 L",
      "category": "paints",
      "price": 185000,
      "currency": "UGX",
      "in_stock": true
    },
    {
      "sku": "PNT-ENM-4L-BLK",
      "name": "Gloss Enamel, Black, 4 L",
      "category": "paints",
      "price": 62000,
      "currency": "UGX",
      "in_stock": true
    }
  ],
  "next_cursor": "c_01HZX9"
}
`),
      ],
    },
    {
      id: "orders",
      title: "Orders",
      blocks: [
        p(
          `Create an order with a list of SKUs and quantities. The order starts as \`pending\` until payment is confirmed.`,
        ),
        code(`
POST /orders

{
  "email": "buyer@example.com",
  "products": [
    { "sku": "PNT-EMU-20L-WHT", "quantity": 2 }
  ]
}
`),
        table(
          ["Status", "Meaning"],
          ["pending", "Created, waiting for payment"],
          ["processing", "Paid, being prepared"],
          ["success", "Completed"],
          ["failed", "Payment failed or order cancelled"],
        ),
        p(`Fetch an order at any time with \`GET /orders/{id}\`.`),
      ],
    },
    {
      id: "webhooks",
      title: "Webhooks",
      blocks: [
        p(
          `Register an HTTPS endpoint and we will call it when something changes. Supported events:`,
        ),
        table(
          ["Event", "Sent when"],
          ["order.created", "A new order has been saved"],
          ["payment.successful", "A payment has been confirmed"],
        ),
        p(
          `Each request includes an \`X-FirstDepot-Signature\` header: an HMAC-SHA256 of the raw body using your webhook secret. Verify it before trusting the payload.`,
        ),
        code(`
import { createHmac, timingSafeEqual } from "node:crypto";

export function isValid(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
`),
        p(`Reply with a \`2xx\` status within 10 seconds. We retry failed deliveries with increasing delays for up to 24 hours.`),
      ],
    },
    {
      id: "errors",
      title: "Errors",
      blocks: [
        p(`Errors use standard HTTP status codes and a JSON body with a \`message\`.`),
        table(
          ["Status", "Meaning"],
          ["400", "The request was invalid"],
          ["401", "Missing or invalid API key"],
          ["403", "Your key cannot do this"],
          ["404", "Not found"],
          ["429", "Too many requests, slow down"],
          ["500", "Something went wrong on our side"],
        ),
      ],
    },
    {
      id: "limits",
      title: "Rate limits",
      blocks: [
        p(
          `Each key can make 60 requests per minute. The \`X-RateLimit-Remaining\` header shows how many you have left. When you hit the limit you will receive a \`429\` with a \`Retry-After\` header.`,
        ),
      ],
    },
    {
      id: "support",
      title: "Getting help",
      blocks: [
        p(
          `Questions, bug reports and access requests: [${c.email.developers}](mailto:${c.email.developers}). Please include the request ID from the \`X-Request-Id\` response header.`,
        ),
      ],
    },
  ],
};
