import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import FrameBreakout from "../components/FrameBreakout";

const paymentServiceUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;

// Pesapal redirects the customer back here with these query params.
type SearchParams = {
  OrderTrackingId?: string;
  OrderMerchantReference?: string;
};

const OrdersLink = ({ children }: { children: React.ReactNode }) => (
  <Link href="/orders" className="underline">
    {children}
  </Link>
);

const renderContent = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | undefined;
}) => {
  const params = (await searchParams) ?? {};
  const { OrderTrackingId, OrderMerchantReference } = params;

  if (!OrderTrackingId) {
    return <div>No payment reference found!</div>;
  }

  if (!paymentServiceUrl) {
    console.error(
      "NEXT_PUBLIC_PAYMENT_SERVICE_URL is not set - cannot check payment status.",
    );
    return (
      <div>
        Couldn&apos;t check your payment status right now. If money was taken
        from your account, it will still be processed - please check{" "}
        <OrdersLink>your orders</OrdersLink> shortly.
      </div>
    );
  }

  try {
    // /mobile-money/status/:reference sits behind shouldBeUser, so it needs
    // a bearer token when called from this server component.
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return (
        <div>
          Unable to verify your session. Please{" "}
          <Link href="/sign-in" className="underline">
            sign in
          </Link>{" "}
          and check <OrdersLink>your orders</OrdersLink> for the payment status.
        </div>
      );
    }

    const res = await fetch(
      `${paymentServiceUrl}/mobile-money/status/${encodeURIComponent(OrderTrackingId)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );

    if (!res.ok) {
      console.error(
        `Failed to fetch payment status: ${res.status} ${await res.text().catch(() => "")}`,
      );
      return (
        <div>
          Couldn&apos;t confirm your payment status. Please check{" "}
          <OrdersLink>your orders</OrdersLink> to see if it went through.
        </div>
      );
    }

    // { reference, status: "pending" | "successful" | "failed" }
    const data: { status: "pending" | "successful" | "failed" } =
      await res.json();

    return (
      <div className="mx-auto max-w-xl py-8">
        <h1 className="mb-2 text-2xl font-medium">Payment {data.status}</h1>
        {data.status === "successful" && (
          <p className="text-sm text-gray-600">
            Thank you! Your order is being created and will appear in your
            orders within a few moments.
          </p>
        )}
        {data.status === "pending" && (
          <p className="text-sm text-gray-600">
            We&apos;re still waiting for confirmation. Your order will appear in
            your orders once the payment completes.
          </p>
        )}
        {data.status === "failed" && (
          <p className="text-sm text-gray-600">
            The payment didn&apos;t go through. You have not been charged for
            this attempt - you can go back to the cart and try again.
          </p>
        )}
        {OrderMerchantReference && (
          <p className="mt-2 text-xs text-gray-500">
            Reference: {OrderMerchantReference}
          </p>
        )}
        <div className="mt-4">
          <Link href="/orders" className="underline">
            See your orders
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch payment status:", error);
    return (
      <div>
        Something went wrong while checking your payment. Please check{" "}
        <OrdersLink>your orders</OrdersLink> to see if it went through.
      </div>
    );
  }
};

const ReturnPage = async (props: {
  searchParams: Promise<SearchParams> | undefined;
}) => (
  <>
    <FrameBreakout />
    {await renderContent(props)}
  </>
);

export default ReturnPage;
