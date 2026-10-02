import type { Product, Category } from "@repo/product-db";
import z from "zod";

export type ProductType = Product;

export type ProductsType = ProductType[];

export type StripeProductType = {
  id: string;
  name: string;
  price: number;
};

export type ColorSwatch = {
  code: string;
  name: string;
  hex: string;
};

export type ColorGroup = {
  id: string;
  label: string;
  dot: string;
  colors: ColorSwatch[];
};

// Full color range, grouped for display (search bar + swatch picker use this).
export const colorPalette: ColorGroup[] = [
  {
    id: "greys-whites",
    label: "Greys & Whites",
    dot: "#a0a09a",
    colors: [
      { code: "00 A 00", name: "Jet Black", hex: "#1a1a1a" },
      { code: "00 A 01", name: "Silver Birch", hex: "#e8e5e0" },
      { code: "00 A 02", name: "Oyster White", hex: "#ede8df" },
      { code: "00 A 03", name: "Cream", hex: "#f5f0e0" },
      { code: "00 A 04", name: "Silver Grey / Iron Grey", hex: "#c0bfba" },
      { code: "00 A 05", name: "Smoke Grey", hex: "#b8b8b3" },
      { code: "00 A 06", name: "Light Grey", hex: "#d0d0cb" },
      { code: "00 A 07", name: "Concrete Grey", hex: "#9a9a95" },
      { code: "00 A 09", name: "Granite", hex: "#878784" },
      { code: "00 A 11", name: "Charcoal", hex: "#4a4a4a" },
      { code: "00 A 13", name: "Carbon", hex: "#3a3a3c" },
    ],
  },
  {
    id: "reds-pinks",
    label: "Reds & Pinks",
    dot: "#c8102e",
    colors: [
      { code: "02 C 33", name: "Orchid", hex: "#e8c8c8" },
      { code: "02 C 37", name: "Dusty Red", hex: "#b87878" },
      { code: "02 C 39", name: "Burgundy", hex: "#7a2848" },
      { code: "02 C 40", name: "Deep Plum", hex: "#3e1a38" },
      { code: "04 B 15", name: "Lotus", hex: "#f5eee0" },
      { code: "04 B 17", name: "Blossom", hex: "#e8d0c4" },
      { code: "04 B 21", name: "Rose Grey", hex: "#c8a898" },
      { code: "04 C 33", name: "Flamingo", hex: "#f0b8a0" },
      { code: "04 C 37", name: "Roman Red", hex: "#b86060" },
      { code: "04 C 39", name: "Chestnut", hex: "#7a3838" },
      { code: "04 D 44", name: "Paprika", hex: "#b82030" },
      { code: "04 D 45", name: "Cherry", hex: "#8a0828" },
      { code: "04 E 47", name: "Coral Pink", hex: "#f8c8b8" },
      { code: "04 E 51", name: "Fireball", hex: "#f05040" },
      { code: "04 E 53", name: "Signal", hex: "#c81030" },
      { code: "04 E 55", name: "Red Oxide", hex: "#8b1a10" },
    ],
  },
  {
    id: "oranges-browns",
    label: "Oranges & Browns",
    dot: "#d2691e",
    colors: [
      { code: "06 C 33", name: "Peanut", hex: "#e8c0a0" },
      { code: "06 C 37", name: "Beetle Nut", hex: "#a05848" },
      { code: "06 C 39", name: "Tobacco", hex: "#6a2810" },
      { code: "06 D 43", name: "Seville Orange", hex: "#c86030" },
      { code: "06 D 44", name: "Nutmeg", hex: "#903428" },
      { code: "06 E 50", name: "Apricot", hex: "#f0a878" },
      { code: "06 E 51", name: "Tangerine", hex: "#e06040" },
      { code: "06 E 56", name: "Harvest Gold", hex: "#9a3018" },
      { code: "08 B 15", name: "Magnolia", hex: "#f8f0e0" },
      { code: "08 B 17", name: "Sandstone / Beige", hex: "#e8d8c0" },
      { code: "08 B 18", name: "Brown Beige", hex: "#c8a878" },
      { code: "08 B 19", name: "Clay Brown", hex: "#b08060" },
      { code: "08 B 21", name: "Mink", hex: "#c0a888" },
      { code: "08 B 25", name: "Peat", hex: "#988070" },
      { code: "08 B 29", name: "Midnight", hex: "#382820" },
      { code: "08 C 31", name: "Honeysuckle", hex: "#f0e0c0" },
      { code: "08 C 35", name: "Cinnamon", hex: "#d09060" },
      { code: "08 C 37", name: "Old Gold", hex: "#c09050" },
      { code: "08 C 39", name: "Suede", hex: "#a07040" },
      { code: "08 E 51", name: "Saffron", hex: "#e88018" },
    ],
  },
  {
    id: "yellows-neutrals",
    label: "Yellows & Neutrals",
    dot: "#d4a017",
    colors: [
      { code: "10 A 03", name: "Pearl Grey", hex: "#d8d8d0" },
      { code: "10 A 07", name: "Storm", hex: "#a8a898" },
      { code: "10 A 11", name: "Tempest", hex: "#787870" },
      { code: "10 B 15", name: "Soft White", hex: "#f8f4e8" },
      { code: "10 B 17", name: "Kraft Grey", hex: "#e0d8c8" },
      { code: "10 B 21", name: "Lava", hex: "#988070" },
      { code: "10 B 25", name: "Prairie Dust", hex: "#b0987c" },
      { code: "10 B 29", name: "Nightfall", hex: "#302818" },
      { code: "10 C 31", name: "Ivory", hex: "#f8f0d0" },
      { code: "10 C 33", name: "Mimosa", hex: "#f8e898" },
      { code: "10 C 35", name: "Spice", hex: "#c8a85c" },
      { code: "10 C 39", name: "Havana", hex: "#7a5018" },
      { code: "10 D 43", name: "Mustard", hex: "#c89820" },
      { code: "10 D 45", name: "Honeycomb", hex: "#9a7808" },
      { code: "10 E 49", name: "Primrose", hex: "#f8f0a8" },
      { code: "10 E 50", name: "Sweetcorn", hex: "#f8e868" },
      { code: "10 E 53", name: "Valencia", hex: "#f0d000" },
    ],
  },
  {
    id: "greens",
    label: "Greens",
    dot: "#3a7d44",
    colors: [
      { code: "12 B 15", name: "Glacier Green", hex: "#eeefdc" },
      { code: "12 B 17", name: "Sage", hex: "#d8d8b0" },
      { code: "12 B 21", name: "Florida Green", hex: "#a8a878" },
      { code: "12 B 25", name: "Olive / Olive Green", hex: "#787860" },
      { code: "12 B 29", name: "Cape Green", hex: "#303018" },
      { code: "12 C 31", name: "Snowberry", hex: "#e8f0e0" },
      { code: "12 C 33", name: "Fiesta", hex: "#d8e0a0" },
      { code: "12 C 38", name: "Army Green", hex: "#5a6030" },
      { code: "12 C 39", name: "Evergreen", hex: "#505020" },
      { code: "12 D 43", name: "Citrus", hex: "#a0a820" },
      { code: "12 D 45", name: "Conifer", hex: "#808020" },
      { code: "12 E 51", name: "Lollipop", hex: "#c8d800" },
      { code: "12 E 53", name: "Lime", hex: "#a8c820" },
      { code: "14 C 35", name: "Orbit Green", hex: "#a0b880" },
      { code: "14 C 38", name: "Forest Green", hex: "#2d6a30" },
      { code: "14 C 39", name: "Mallard", hex: "#284820" },
      { code: "14 C 40", name: "Vintage Green", hex: "#283020" },
      { code: "14 E 51", name: "Apple", hex: "#58b840" },
      { code: "14 E 53", name: "Emerald Green", hex: "#188840" },
      { code: "16 C 33", name: "Sky Blue", hex: "#c0d8c8" },
    ],
  },
  {
    id: "blues-teals",
    label: "Blues & Teals",
    dot: "#1a5a8a",
    colors: [
      { code: "16 C 37", name: "Orion", hex: "#a8c8b8" },
      { code: "16 D 45", name: "Winter Blue", hex: "#0a5840" },
      { code: "16 E 53", name: "Turquoise", hex: "#108870" },
      { code: "18 B 17", name: "Ice", hex: "#d8e0e0" },
      { code: "18 B 21", name: "Typhoon", hex: "#a0b0b0" },
      { code: "18 B 29", name: "Gun Metal", hex: "#182828" },
      { code: "18 C 31", name: "Angel Blue", hex: "#e0f0e8" },
      { code: "18 C 35", name: "Horizon Blue", hex: "#a0b8c0" },
      { code: "18 C 39", name: "Deep Blue", hex: "#085870" },
      { code: "18 D 43", name: "Denim", hex: "#0880a0" },
      { code: "18 E 49", name: "Baby Blue", hex: "#c8e0e0" },
      { code: "18 E 50", name: "Oasis Blue", hex: "#a0d8e8" },
      { code: "18 E 51", name: "Rich Blue", hex: "#10a0c8" },
      { code: "18 E 53", name: "Cornflower", hex: "#0080a8" },
      { code: "20 C 33", name: "Pale Lilac", hex: "#d0d8e8" },
      { code: "20 C 37", name: "Jacaranda", hex: "#6888a8" },
      { code: "20 C 40", name: "Electric Blue", hex: "#082848" },
      { code: "20 D 45", name: "Sapphire", hex: "#0a4878" },
      { code: "20 E 51", name: "Calypso Blue", hex: "#4098d0" },
    ],
  },
  {
    id: "purples",
    label: "Purples",
    dot: "#6a3d8f",
    colors: [
      { code: "22 B 15", name: "Gardenia", hex: "#f0ece4" },
      { code: "22 B 17", name: "Lilac Haze", hex: "#ddd0d8" },
      { code: "22 B 20", name: "Blue Lilac", hex: "#c0b8d8" },
      { code: "22 C 37", name: "Tropical Violet", hex: "#7878a8" },
      { code: "22 D 45", name: "Spanish Violet", hex: "#404098" },
      { code: "24 C 33", name: "Purple Haze", hex: "#e0c8d8" },
      { code: "24 C 39", name: "Current", hex: "#603080" },
    ],
  },
  {
    id: "basic-colors",
    label: "Basic Colors",
    dot: "#4b5563",
    colors: [
      { code: "BASIC-01", name: "Blue", hex: "#0000ff" },
      { code: "BASIC-02", name: "Green", hex: "#008000" },
      { code: "BASIC-03", name: "Red", hex: "#ff0000" },
      { code: "BASIC-04", name: "Yellow", hex: "#ffff00" },
      { code: "BASIC-05", name: "Purple", hex: "#800080" },
      { code: "BASIC-06", name: "Orange", hex: "#ffa500" },
      { code: "BASIC-07", name: "Pink", hex: "#ffc0cb" },
      { code: "BASIC-08", name: "Brown", hex: "#a52a2a" },
      { code: "BASIC-09", name: "Gray", hex: "#808080" },
      { code: "BASIC-10", name: "Black", hex: "#000000" },
      { code: "BASIC-11", name: "White", hex: "#ffffff" },
    ],
  },
];

// Flat list of every color name, sorted alphabetically. Kept as `colors`
// for backward compatibility with any code still expecting a flat string
// array; `colorPalette`/`allColors` above carry the hex + grouping data
// the picker UI needs.
export const allColors: ColorSwatch[] = colorPalette
  .flatMap((group) => group.colors)
  .sort((a, b) => a.name.localeCompare(b.name));

export const colors = allColors.map((c) => c.name);

// Units of measure for hardware/construction/home-improvement products.
// The entrant types the size value themselves (e.g. "20", "6 by 6", "1")
// and picks (or free-types) a unit here, e.g. "20 Liters", "1 Inch".
export const units = [
  "Liters",
  "Milliliters",
  "Meters",
  "Centimeters",
  "Millimeters",
  "Feet",
  "Inches",
  "Kilograms",
  "Grams",
  "Pieces",
  "Pairs",
  "Rolls",
  "Bags",
  "Cartons",
  "Boxes",
  "Dozen",
  "Sets",
  "Sheets",
  "Tons",
  "Each",
  "Single Unit",
] as const;

export type UnitType = (typeof units)[number];

export const ProductFormSchema = z
  .object({
    name: z
      .string({ message: "Product name is required!" })
      .min(1, { message: "Product name is required!" }),
    shortDescription: z
      .string({ message: "Short description is required!" })
      .min(1, { message: "Short description is required!" })
      .max(60),
    description: z
      .string({ message: "Description is required!" })
      .min(1, { message: "Description is required!" }),
    price: z
      .number({ message: "Price is required!" })
      .min(1, { message: "Price is required!" }),
    categorySlug: z
      .string({ message: "Category is required!" })
      .min(1, { message: "Category is required!" }),
    sizes: z
      .array(z.string().min(1))
      .min(1, { message: "At least one size is required!" }),
    colors: z
      .array(z.string().min(1))
      .min(1, { message: "At least one color is required!" }),
    images: z.record(z.string(), z.string(), {
      message: "Image for each color is required!",
    }),
  })
  .refine(
    (data) => {
      const missingImages = data.colors.filter(
        (color: string) => !data.images?.[color]
      );
      return missingImages.length === 0;
    },
    {
      message: "Image is required for each selected color!",
      path: ["images"],
    }
  );

export type CategoryType = Category;

export const CategoryFormSchema = z.object({
  name: z
    .string({ message: "Name is Required!" })
    .min(1, { message: "Name is Required!" }),
  slug: z
    .string({ message: "Slug is Required!" })
    .min(1, { message: "Slug is Required!" }),
});