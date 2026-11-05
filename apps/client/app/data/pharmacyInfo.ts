/*
 * The pharmacy's real details, shown on the pharmacy pages.
 *
 * FILL THESE IN with your actual licence and pharmacist details before the
 * pharmacy section goes live. Nothing is shown for an empty value: the page
 * never displays a licence or a pharmacist you haven't entered.
 */
export const PHARMACY_INFO = {
  // The authority that licenses retail pharmacies in Uganda.
  licensedBy: "National Drug Authority (NDA), Uganda",
  // Your retail pharmacy licence number, exactly as on the licence.
  licenceNumber: "",
  // The pharmacist in charge, and their registration number.
  responsiblePharmacist: "",
  pharmacistRegistration: "",
  // How customers reach the pharmacy about a prescription.
  phone: "",
  whatsapp: "",
  openingHours: "",
} as const;