import Image from "next/image";

// To use real brand logos, drop the files in /public/payments and add
// `logo: "/payments/mtn.png"` to the matching entry. Until then each method
// shows as a clean text badge (no borrowed or redrawn logos).
type Method = { name: string; dot: string; logo?: string };

const methods: Method[] = [
  { name: "Pesapal", dot: "bg-sky-600" },
  { name: "MTN MoMo", dot: "bg-yellow-400" },
  { name: "Airtel Money", dot: "bg-red-600" },
  { name: "Mastercard", dot: "bg-orange-500" },
];

const PaymentMethods = () => (
  <div>
    <p className="text-sm font-medium text-gray-900">Pay securely with</p>
    <ul className="mt-3 flex flex-wrap gap-2">
      {methods.map((m) => (
        <li
          key={m.name}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-xs font-medium text-gray-700"
        >
          {m.logo ? (
            <Image
              src={m.logo}
              alt={m.name}
              width={56}
              height={24}
              className="h-5 w-auto object-contain"
            />
          ) : (
            <>
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${m.dot}`}
              />
              {m.name}
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default PaymentMethods;
