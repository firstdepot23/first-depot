import type { Metadata } from "next";
import PrescriptionUploadForm from "../../components/pharmacy/PrescriptionUploadForm";
import { getProduct } from "../../lib/getProduct";

export const metadata: Metadata = {
  title: "Upload a prescription",
  // A personal, signed-in page: nothing for search engines to index.
  robots: { index: false, follow: false },
};

const MAX_REQUESTED = 5;

const UploadPrescriptionPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[] }>;
}) => {
  const { product } = await searchParams;

  // /pharmacy/upload?product=12 (or several): the medicines the customer
  // asked for, so the pharmacist sees them alongside the prescription.
  const ids = [
    ...new Set(
      (Array.isArray(product) ? product : product ? [product] : [])
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ].slice(0, MAX_REQUESTED);

  const found = await Promise.all(
    ids.map((id) => getProduct(String(id)).catch(() => null)),
  );
  const requested = found.flatMap((p) =>
    p && p.segment === "PHARMACY" ? [{ id: Number(p.id), name: p.name }] : [],
  );

  return (
    <div className="grid gap-10 pb-8 pt-6 sm:pt-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <header className="mb-8">
          <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
            Pharmacy
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Upload your prescription
          </h1>
          <p className="mt-3 max-w-md text-base text-gray-500">
            Send us clear photos and a pharmacist will take it from there.
          </p>
        </header>

        <PrescriptionUploadForm requested={requested} />
      </div>

      <aside className="flex flex-col gap-5 lg:col-span-5">
        <div className="rounded-2xl bg-green-50 p-6 ring-1 ring-green-900/5">
          <h2 className="font-semibold text-gray-900">For a clear photo</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
            <li>Lay it flat, in good light.</li>
            <li>Keep the whole page in view, corners included.</li>
            <li>Check every word can be read.</li>
            <li>Add a photo of each page if there is more than one.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
            <li>We receive your prescription and give you a reference.</li>
            <li>A pharmacist reviews it.</li>
            <li>
              We call you to confirm your medicines, the price and delivery or
              pickup.
            </li>
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            Your photos are stored privately and are never shown publicly.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default UploadPrescriptionPage;
