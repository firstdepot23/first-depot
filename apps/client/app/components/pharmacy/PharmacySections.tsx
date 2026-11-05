import {
  ClipboardList,
  FileUp,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { PHARMACY_INFO } from "../../data/pharmacyInfo";

// ---------------------------------------------------------------------------
// The three things you can do here (the "services" menu on the pharmacy
// sites this page is modelled on).
// ---------------------------------------------------------------------------
const SERVICES = [
  {
    href: "/pharmacy/upload",
    Icon: FileUp,
    title: "Upload a prescription",
    text: "Take a photo or choose one from your gallery.",
  },
  {
    href: "/pharmacy/prescriptions",
    Icon: ClipboardList,
    title: "Track your prescriptions",
    text: "See where each one is and read our pharmacist\u2019s notes.",
  },
  {
    href: "/docs/contacts",
    Icon: MessageCircle,
    title: "Ask our pharmacy team",
    text: "Questions about a medicine before you buy.",
  },
];

export const ServiceTiles = () => (
  <ul className="grid gap-3 sm:grid-cols-3">
    {SERVICES.map(({ href, Icon, title, text }) => (
      <li key={title}>
        <Link
          href={href}
          className="flex h-full items-start gap-4 rounded-2xl border border-gray-200 p-5 transition-shadow hover:shadow-lg hover:shadow-gray-900/5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-gray-900">
              {title}
            </span>
            <span className="mt-0.5 block text-sm text-gray-500">{text}</span>
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

// ---------------------------------------------------------------------------
// How it works: the same three steps as the real workflow today.
// ---------------------------------------------------------------------------
const STEPS = [
  {
    title: "Upload your prescription",
    text: "Sign in, add clear photos of your prescription and tell us how to reach you.",
  },
  {
    title: "Our pharmacist reviews it",
    text: "We check it and call you to confirm your medicines, the price and delivery or pickup.",
  },
  {
    title: "Get your medicines",
    text: "Pay and receive your order by delivery, or collect it from our station.",
  },
];

export const HowItWorks = () => (
  <section
    id="how-it-works"
    aria-labelledby="how-heading"
    className="scroll-mt-24"
  >
    <h2
      id="how-heading"
      className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
    >
      How it works
    </h2>
    <ol className="mt-6 grid gap-4 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <li
          key={step.title}
          className="rounded-2xl bg-green-50 p-6 ring-1 ring-green-900/5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white">
            {i + 1}
          </span>
          <p className="mt-4 font-semibold text-gray-900">{step.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  </section>
);

// ---------------------------------------------------------------------------
// FAQ: native <details>, so it works without any JavaScript.
// ---------------------------------------------------------------------------
const FAQS = [
  {
    q: "Do I need a prescription?",
    a: "Prescription-only medicines are dispensed only with a valid prescription. Products marked Rx can\u2019t be added to the cart: upload your prescription instead. Many everyday health and wellness products don\u2019t need one and can be added to your cart as usual.",
  },
  {
    q: "What makes a good prescription photo?",
    a: "Lay the prescription flat in good light, keep the whole page in view and make sure every word is readable. If you have more than one page, add a photo of each. A blurry or cut-off photo means we will have to ask you for another.",
  },
  {
    q: "Who can see my prescription?",
    a: "Your photos are stored privately and are never shown publicly. You can see them under My prescriptions, and they are used only to prepare your order.",
  },
  {
    q: "How do I pay and get my medicines?",
    a: "After a pharmacist reviews your prescription we contact you on the number you gave to confirm the medicines, the price and whether you want delivery or pickup.",
  },
  {
    q: "How do I know if you need something from me?",
    a: "Open My prescriptions. If we need a clearer photo or have a question, the status changes to Action needed and our note is shown there.",
  },
];

export const PharmacyFaq = () => (
  <section aria-labelledby="faq-heading">
    <h2
      id="faq-heading"
      className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
    >
      You may be wondering
    </h2>
    <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
      {FAQS.map(({ q, a }) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
            {q}
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6l5 5 5-5" />
            </svg>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            {a}
          </p>
        </details>
      ))}
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Licence details. Only what has been filled in (data/pharmacyInfo.ts) is
// shown: nothing is ever claimed that hasn't been entered.
// ---------------------------------------------------------------------------
export const LicenceNotice = () => {
  const info = PHARMACY_INFO;
  if (!info.licenceNumber) return null;

  return (
    <section
      aria-labelledby="licence-heading"
      className="rounded-2xl border border-gray-200 p-6"
    >
      <h2
        id="licence-heading"
        className="flex items-center gap-2 text-lg font-semibold text-gray-900"
      >
        <ShieldCheck className="h-5 w-5 text-green-600" />
        Licensed pharmacy
      </h2>
      <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Licensed by</dt>
          <dd className="text-gray-900">{info.licensedBy}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Licence number</dt>
          <dd className="text-gray-900">{info.licenceNumber}</dd>
        </div>
        {info.responsiblePharmacist && (
          <div>
            <dt className="text-gray-500">Pharmacist in charge</dt>
            <dd className="text-gray-900">
              {info.responsiblePharmacist}
              {info.pharmacistRegistration &&
                ` (reg. ${info.pharmacistRegistration})`}
            </dd>
          </div>
        )}
        {info.phone && (
          <div>
            <dt className="text-gray-500">Pharmacy line</dt>
            <dd className="text-gray-900">{info.phone}</dd>
          </div>
        )}
        {info.openingHours && (
          <div>
            <dt className="text-gray-500">Opening hours</dt>
            <dd className="text-gray-900">{info.openingHours}</dd>
          </div>
        )}
      </dl>
    </section>
  );
};
