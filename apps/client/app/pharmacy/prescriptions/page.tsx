import type { Metadata } from "next";
import MyPrescriptions from "../../components/pharmacy/MyPrescriptions";

export const metadata: Metadata = {
  title: "My prescriptions",
  robots: { index: false, follow: false },
};

const MyPrescriptionsPage = () => (
  <div className="pb-8 pt-6 sm:pt-10">
    <header className="mb-8">
      <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
        Pharmacy
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
        My prescriptions
      </h1>
      <p className="mt-3 max-w-md text-base text-gray-500">
        Follow each prescription and read any note from our pharmacist.
      </p>
    </header>

    <div className="max-w-2xl">
      <MyPrescriptions />
    </div>
  </div>
);

export default MyPrescriptionsPage;
