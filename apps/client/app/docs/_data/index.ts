import { about } from "./about";
import { contacts } from "./contacts";
import { developer } from "./developer";
import { help } from "./help";
import { privacy } from "./privacy";
import { products } from "./products";
import { returns } from "./returns";
import { security } from "./security";
import { terms } from "./terms";
import type { DocGroup, DocPage } from "./schema";

// Order here = order of the previous/next links at the bottom of each page.
export const docs: DocPage[] = [
  terms,
  privacy,
  returns,
  about,
  contacts,
  help,
  security,
  developer,
  products,
];

// Order of the headings on the /docs index.
export const groupOrder: DocGroup[] = [
  "Policies",
  "Company",
  "Help and safety",
  "Build and shop",
];

export const getDoc = (slug: string) => docs.find((d) => d.slug === slug);

// Set to false once the placeholder text has been replaced and reviewed.
export const SHOW_ADDRESS = true;
