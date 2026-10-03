import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const paymentServiceUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;

type SearchParams = {
  session_id?: string; // Stripe's return_url param
  OrderTrackingId?: string; // Pesapal's callback param
  OrderMerchantReference?: string; // Pesapal's callback param
};

const ReturnPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | undefined;
}) => {
  const params = (await searchParams) ?? {};
  const { session_id, OrderTrackingId, OrderMerchantReference } = params;

  if (!session_id && !OrderTrackingId) {
    return <div>No session id found!</div>;
  }

  if (!paymentServiceUrl) {
    // This is exactly what produced "Failed to parse URL from
    // undefined/sessions/...": the env var wasn't set, so the template
    // string below silently became "undefined/sessions/...".
    console.error(
      "NEXT_PUBLIC_PAYMENT_SERVICE_URL is not set - cannot check payment status.",
    );
    return (
      <div>
        Couldn&apos;t check your payment status right now. If money was taken
        from your account, it will still be processed — please check{" "}
        <Link href="/orders" className="underline">
          your orders
        </Link>{" "}
        shortly.
      </div>
    );
  }

  // Stripe's own /sessions/:id route is public, but mobile-money's
  // /status/:reference route sits behind shouldBeUser (it needs to know
  // whose payment this is), so it needs a bearer token when we hit it
  // from this server component.
  const isMobileMoney = Boolean(OrderTrackingId);
  const statusUrl = isMobileMoney
    ? `${paymentServiceUrl}/mobile-money/status/${OrderTrackingId}`
    : `${paymentServiceUrl}/sessions/${session_id}`;

  try {
    let headers: HeadersInit | undefined;
    if (isMobileMoney) {
      const { getToken } = await auth();
      const token = await getToken();
      if (!token) {
        return (
          <div>
            Unable to verify your session. Please{" "}
            <Link href="/sign-in" className="underline">
              sign in
            </Link>{" "}
            and check{" "}
            <Link href="/orders" className="underline">
              your orders
            </Link>{" "}
            for the payment status.
          </div>
        );
      }
      headers = { Authorization: `Bearer ${token}` };
    }

    const res = await fetch(statusUrl, { headers, cache: "no-store" });

    if (!res.ok) {
      console.error(
        `Failed to fetch session status: ${res.status} ${await res.text().catch(() => "")}`,
      );
      return (
        <div>
          Couldn&apos;t confirm your payment status. Please check{" "}
          <Link href="/orders" className="underline">
            your orders
          </Link>{" "}
          to see if it went through.
        </div>
      );
    }

    const data = await res.json();

    // Stripe's /sessions/:id returns { status, paymentStatus }. Mobile
    // money's /status/:reference returns { status } directly
    // ("pending" | "successful" | "failed") - fall back to `status` for
    // the detail line so both shapes render sensibly.
    const headline = data.status;
    const detail = data.paymentStatus ?? data.status;

    return (
      <div className="">
        <h1>Payment {headline}</h1>
        <p>Payment status: {detail}</p>
        {OrderMerchantReference && <p>Reference: {OrderMerchantReference}</p>}
        <Link href="/orders">See your orders</Link>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch session status:", error);
    return (
      <div>
        Something went wrong while checking your payment. Please check{" "}
        <Link href="/orders" className="underline">
          your orders
        </Link>{" "}
        to see if it went through.
      </div>
    );
  }
};

export default ReturnPage;
