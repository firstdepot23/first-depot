import Link from "next/link";
import type { Unavailable } from "../lib/productRules";

/**
 * Replaces the Add to Cart button when a product can't be ordered online.
 * `compact` is the one-line version for product cards.
 */
const UnavailableNotice = ({
  reason,
  compact = false,
  productId,
}: {
  reason: Unavailable;
  compact?: boolean;
  // Lets the upload page tell the pharmacist which medicine was asked for.
  productId?: number;
}) => {
  if (reason === "prescription") {
    const uploadHref = productId
      ? `/pharmacy/upload?product=${productId}`
      : "/pharmacy/upload";
    if (compact) {
      return (
        <Link
          href={uploadHref}
          className="flex h-10 shrink-0 items-center justify-center rounded-full border border-gray-300 px-5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          Upload prescription
        </Link>
      );
    }
    return (
      <div
        role="note"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
      >
        <p className="text-sm font-semibold text-amber-900">
          Prescription required
        </p>
        <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
          This medicine is dispensed only with a valid prescription, so it
          can&rsquo;t be added to the cart. Upload a photo of your prescription
          and our pharmacist will review it and contact you to arrange your
          order.
        </p>
        <Link
          href={uploadHref}
          className="mt-3 inline-flex text-sm font-semibold text-green-700 transition-colors hover:text-green-600"
        >
          Upload your prescription
        </Link>
      </div>
    );
  }

  const label = reason === "expired" ? "Unavailable" : "Out of stock";

  if (compact) {
    return (
      <span className="flex h-10 shrink-0 items-center rounded-full bg-gray-100 px-5 text-sm font-medium text-gray-500">
        {label}
      </span>
    );
  }
  return (
    <p className="rounded-2xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-600">
      {label}. Check back soon, or contact us if you need this item.
    </p>
  );
};

export default UnavailableNotice;
