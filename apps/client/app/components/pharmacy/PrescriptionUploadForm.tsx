"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Camera, Check, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { compressImage } from "../../lib/compressImage";
import {
  submitPrescription,
  type SubmittedPrescription,
} from "../../lib/pharmacyApi";

const MAX_PHOTOS = 5;
// Photos are shrunk before upload (see compressImage), so this is generous.
// It stays under typical hosting request limits (about 4.5 MB).
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

type Photo = { id: number; blob: Blob; url: string };
type Requested = { id: number; name: string };

const PrescriptionUploadForm = ({ requested }: { requested: Requested[] }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { openSignIn } = useClerk();
  const { user } = useUser();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<SubmittedPrescription | null>(null);
  const [dragging, setDragging] = useState(false);

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  // Start with the account holder's name (they can change it: the patient may
  // be someone else).
  useEffect(() => {
    if (user?.fullName) setPatientName((current) => current || user.fullName!);
  }, [user?.fullName]);

  // Temporary preview URLs hold memory until released.
  useEffect(
    () => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  );

  const addFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    if (list.length > room) {
      setError(
        `Only the first ${room} photo${room === 1 ? "" : "s"} were added (limit ${MAX_PHOTOS}).`,
      );
    }

    setPreparing(true);
    const added: Photo[] = [];
    for (const file of Array.from(list).slice(0, room)) {
      try {
        const blob = await compressImage(file);
        added.push({
          id: nextId.current++,
          blob,
          url: URL.createObjectURL(blob),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't add that photo.",
        );
      }
    }
    setPhotos((current) => [...current, ...added]);
    setPreparing(false);
  };

  const removePhoto = (id: number) => {
    setPhotos((current) => {
      const gone = current.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return current.filter((p) => p.id !== id);
    });
  };

  // Phone: the customer types the local part; +256 is added, like the
  // mobile money form.
  const phoneDigits = phone.replace(/^0+/, "");
  const phoneValid = /^\d{9}$/.test(phoneDigits);

  const canSubmit =
    photos.length > 0 &&
    patientName.trim().length >= 2 &&
    phoneValid &&
    consent &&
    !preparing &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    const total = photos.reduce((sum, p) => sum + p.blob.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setError(
        "The photos are too large to send together. Please remove one or two and try again.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again and retry.");

      const result = await submitPrescription(token, {
        images: photos.map((p) => p.blob),
        patientName: patientName.trim(),
        phone: `+256${phoneDigits}`,
        notes: notes.trim(),
        requestedProducts: requested.map((r) => ({
          productId: r.id,
          name: r.name,
        })),
      });

      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Sign-in needed -----------------------------------------------------
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 p-6">
        <p className="text-sm text-gray-600">
          Sign in to upload a prescription. This keeps it private to you and
          lets you follow its progress.
        </p>
        <button
          type="button"
          onClick={() => openSignIn()}
          className="cursor-pointer rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  // ---- Done ---------------------------------------------------------------
  if (done) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-6"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            Prescription received
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Your reference is{" "}
            <span className="font-mono font-semibold text-gray-900">
              {done.reference}
            </span>
            . Keep it handy if you call the pharmacy.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            A pharmacist will review it and contact you on the number you gave
            to confirm your medicines, the price and delivery or pickup.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pharmacy/prescriptions"
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            View my prescriptions
          </Link>
          <Link
            href="/pharmacy"
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900"
          >
            Back to the pharmacy
          </Link>
        </div>
      </div>
    );
  }

  // ---- The form -----------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {requested.length > 0 && (
        <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-900 ring-1 ring-green-900/10">
          <p className="font-medium">You&rsquo;re requesting:</p>
          <ul className="mt-1 list-disc pl-5 text-green-900/80">
            {requested.map((r) => (
              <li key={r.id} className="[overflow-wrap:anywhere]">
                {r.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PHOTOS */}
      <div>
        <p className="text-sm font-medium text-gray-900">
          Photos of the prescription
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Up to {MAX_PHOTOS} photos. Make sure all the writing is clear and the
          whole page is in view.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void addFiles(e.dataTransfer.files);
          }}
          className={`mt-3 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-green-600 bg-green-50" : "border-gray-300"
          }`}
        >
          <p className="text-sm text-gray-500">
            Drag photos here, or choose how to add them
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS || preparing}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              Take a photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS || preparing}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-gray-300 px-5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" />
              Choose from gallery
            </button>
          </div>
          {preparing && (
            <p className="text-xs text-gray-500" aria-live="polite">
              Preparing your photo...
            </p>
          )}
        </div>

        {/* Hidden pickers. `capture` opens the camera directly on phones. */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo, i) => (
              <li key={photo.id} className="relative">
                {/* A local preview URL: next/image can't optimise these. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Prescription photo ${i + 1}`}
                  className="aspect-square w-full rounded-xl object-cover ring-1 ring-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute -right-2 -top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white shadow transition-colors hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DETAILS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rxName" className="text-xs font-medium text-gray-500">
            Patient&rsquo;s full name
          </label>
          <input
            id="rxName"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            maxLength={100}
            autoComplete="name"
            className="rounded-md border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-black focus:ring-1 focus:ring-black sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rxPhone"
            className="text-xs font-medium text-gray-500"
          >
            Phone number (we&rsquo;ll call you here)
          </label>
          <div className="flex w-full min-w-0 items-center rounded-md border border-gray-300 px-3 py-2.5 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <span className="mr-2 shrink-0 text-base text-gray-400 sm:text-sm">
              +256
            </span>
            <input
              id="rxPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="7XXXXXXXX"
              inputMode="tel"
              autoComplete="tel-national"
              aria-invalid={phone.length > 0 && !phoneValid}
              className="min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm"
            />
          </div>
          {phone.length > 0 && !phoneValid && (
            <p className="text-xs text-red-600">
              Enter the 9 digits after +256.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rxNotes" className="text-xs font-medium text-gray-500">
          Anything the pharmacist should know (optional)
        </label>
        <textarea
          id="rxNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="For example: allergies, or a medicine you want a cheaper alternative for."
          className="rounded-md border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-black focus:ring-1 focus:ring-black sm:text-sm"
        />
      </div>

      {/* CONSENT */}
      <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-green-600"
        />
        <span>
          I confirm this prescription was issued for the patient named above,
          and I agree that First Depot Pharmacy may use these photos and details
          to prepare my order. Photos are stored privately and are not shown
          publicly.
        </span>
      </label>

      {error && (
        <p role="alert" className="break-words text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-12 w-full cursor-pointer rounded-full bg-green-600 px-6 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Sending your prescription..." : "Send prescription"}
      </button>
    </form>
  );
};

export default PrescriptionUploadForm;
