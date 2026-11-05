// Works out what a file REALLY is from its first few bytes, never from the
// name or the Content-Type the browser claims. A file called "rx.jpg" that is
// actually a script or a PDF is refused, and what gets stored (and later
// served back with that Content-Type) is always one of the three image types.
//
// The shop already converts every photo to JPEG in the browser (see
// compressImage.ts), so JPEG is the normal case. PNG and WEBP are accepted
// because someone can call this service directly, and because they are safe,
// common image formats.

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

// Does `buffer` contain `bytes` starting at `offset`?
const hasBytes = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length &&
  bytes.every((byte, i) => buffer[offset + i] === byte);

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP", 8 bytes in

/** The image type of these bytes, or null if it isn't a JPG, PNG or WEBP. */
export const detectImageType = (buffer: Buffer): ImageType | null => {
  if (hasBytes(buffer, JPEG)) return "image/jpeg";
  if (hasBytes(buffer, PNG)) return "image/png";
  if (hasBytes(buffer, RIFF) && hasBytes(buffer, WEBP, 8)) return "image/webp";
  return null;
};