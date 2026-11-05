// Prescription photos are shrunk in the browser before upload:
//  - phone photos are 4-10 MB; this brings them to a few hundred KB, so
//    five of them upload quickly on a mobile connection
//  - redrawing onto a canvas drops the photo's hidden metadata (including
//    GPS location), so it never leaves the customer's phone
//  - the result is always a plain JPEG, whatever the original was
const MAX_SIDE = 1800; // still sharp enough to read small print
const QUALITY = 0.85;

export const compressImage = async (file: File): Promise<Blob> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a photo (JPG, PNG or WEBP).");
  }

  let bitmap: ImageBitmap;
  try {
    // "from-image": respect the phone's rotation so the photo isn't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "We couldn't read that photo. Try a JPG or PNG, or take a new photo.",
    );
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Your browser couldn't prepare that photo.");
  }
  // JPEG has no transparency: put a white page behind a see-through PNG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error("Your browser couldn't prepare that photo.");
  return blob;
};