import { randomInt } from "node:crypto";

// The customer-facing reference for a prescription, e.g. "RX-K7M3-PQ9T".
// People read it out over the phone ("my reference is..."), so:
//  - no characters that look alike (0/O, 1/I/L are left out)
//  - split into two groups of four so it is easy to say and to copy down
//
// 31 characters ^ 8 = about 850 billion combinations, and the characters come
// from crypto.randomInt, so references can't be guessed or counted. The
// database also enforces uniqueness (see models/prescription.ts), and
// createPrescription retries on the rare clash.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const pick = (length: number) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export const newReference = (): string => `RX-${pick(4)}-${pick(4)}`;