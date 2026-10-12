import { NextRequest } from "next/server";

// Same-origin relay to the cart and payment services.
//
// The browser calls   https://first-depot.com/api/svc/cart/cart
// and this server calls https://<cart-service>.onrender.com/cart
//
// Why: calling the services' *.onrender.com addresses straight from the
// browser fails for any visitor whose network can't resolve that hostname
// (ERR_NAME_NOT_RESOLVED). This way the browser only ever needs
// first-depot.com, and Render's own servers reach each other fine.
//
// The visitor's Clerk token is passed straight through; the services still
// check it themselves, so this adds no new access.

export const dynamic = "force-dynamic";

// A sleeping free-tier service can take a minute to wake up.
const UPSTREAM_TIMEOUT_MS = 80_000;

type ServiceName = "cart" | "payment";

const SERVICES: Record<
  ServiceName,
  { baseUrl: () => string | undefined; allowed: string[] }
> = {
  cart: {
    baseUrl: () =>
      process.env.CART_SERVICE_URL ?? process.env.NEXT_PUBLIC_CART_SERVICE_URL,
    allowed: ["cart"],
  },
  payment: {
    baseUrl: () =>
      process.env.PAYMENT_SERVICE_URL ??
      process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL,
    // Only what the shop uses. The Pesapal webhook (/webhooks) and /health
    // are deliberately NOT reachable through here.
    allowed: ["checkout", "payments", "mobile-money", "bank-card"],
  },
};

const isService = (value: string): value is ServiceName =>
  Object.prototype.hasOwnProperty.call(SERVICES, value);

// Both keys, because the shop's code reads `error` (payment service style)
// in some places and `message` (cart service style) in others.
const reply = (message: string, status: number) =>
  Response.json(
    { error: message, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

type Context = { params: Promise<{ service: string; path: string[] }> };

const forward = async (req: NextRequest, ctx: Context): Promise<Response> => {
  const { service, path } = await ctx.params;

  if (!isService(service)) return reply("Not found", 404);
  const config = SERVICES[service];

  const unsafeSegment = path.some(
    (segment) => segment === "" || segment === "." || segment === "..",
  );
  const [firstSegment] = path;
  if (
    firstSegment === undefined ||
    unsafeSegment ||
    !config.allowed.includes(firstSegment)
  ) {
    return reply("Not found", 404);
  }

  const base = config.baseUrl()?.replace(/\/+$/, "");
  if (!base) {
    console.error(`API relay: no URL configured for the ${service} service`);
    return reply("Service is not configured", 500);
  }

  const target = `${base}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // 502 is a "try again" status for the cart loader (it retries 5xx).
    console.error(`API relay to ${service} failed:`, error);
    return reply("The service is not reachable right now. Please try again.", 502);
  }
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;