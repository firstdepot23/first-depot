// Goes through this site's own server (app/api/svc/[service]/[...path]), like
// the cart and payment calls, rather than straight to the pharmacy service.
const PRESCRIPTIONS_API = "/api/svc/pharmacy/prescriptions";

// The pharmacy service sleeps on Render's free tier too.
const REQUEST_TIMEOUT_MS = 60_000;

export type PrescriptionStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "NEEDS_INFO"
  | "APPROVED"
  | "REJECTED";

export type PrescriptionSummary = {
  id: string;
  reference: string;
  status: PrescriptionStatus;
  patientName: string;
  notes: string;
  imageCount: number;
  requestedProducts: { productId: number; name: string }[];
  // Written by the pharmacist, for the customer.
  pharmacistNote: string;
  createdAt: string;
};

// Plain words for each status, and how it should look.
export const STATUS_INFO: Record<
  PrescriptionStatus,
  { label: string; help: string; tone: "gray" | "blue" | "amber" | "green" | "red" }
> = {
  PENDING: {
    label: "Received",
    help: "We have your prescription. A pharmacist will review it soon.",
    tone: "gray",
  },
  IN_REVIEW: {
    label: "Being reviewed",
    help: "A pharmacist is checking your prescription.",
    tone: "blue",
  },
  NEEDS_INFO: {
    label: "Action needed",
    help: "We need something from you. See the note below.",
    tone: "amber",
  },
  APPROVED: {
    label: "Approved",
    help: "Your prescription is approved. Our team will contact you to arrange your order.",
    tone: "green",
  },
  REJECTED: {
    label: "Can\u2019t be filled",
    help: "We couldn\u2019t fill this prescription. See the note below.",
    tone: "red",
  },
};

const failure = async (res: Response) => {
  // The service answers problems with { error: "..." }.
  const data = await res.json().catch(() => null);
  return new Error(data?.error ?? `Request failed (${res.status})`);
};

export type SubmittedPrescription = {
  id: string;
  reference: string;
  status: PrescriptionStatus;
  createdAt: string;
};

export const submitPrescription = async (
  token: string,
  input: {
    images: Blob[];
    patientName: string;
    phone: string;
    notes: string;
    requestedProducts: { productId: number; name: string }[];
  },
): Promise<SubmittedPrescription> => {
  const form = new FormData();
  input.images.forEach((blob, i) =>
    form.append("images", blob, `prescription-${i + 1}.jpg`),
  );
  form.append("patientName", input.patientName);
  form.append("phone", input.phone);
  form.append("notes", input.notes);
  form.append("consent", "true");
  form.append("requestedProducts", JSON.stringify(input.requestedProducts));

  // No Content-Type header: the browser adds it with the multipart boundary.
  const res = await fetch(PRESCRIPTIONS_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw await failure(res);
  return res.json();
};

export const fetchMyPrescriptions = async (
  token: string,
): Promise<PrescriptionSummary[]> => {
  const res = await fetch(PRESCRIPTIONS_API, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw await failure(res);
  const data = await res.json();
  return Array.isArray(data.prescriptions) ? data.prescriptions : [];
};

// Photos are private, so they can't be a plain <img src>: they are fetched
// with the customer's token and shown from a temporary local URL.
export const fetchPrescriptionImage = async (
  token: string,
  id: string,
  index: number,
): Promise<Blob> => {
  const res = await fetch(`${PRESCRIPTIONS_API}/${id}/images/${index}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw await failure(res);
  return res.blob();
};