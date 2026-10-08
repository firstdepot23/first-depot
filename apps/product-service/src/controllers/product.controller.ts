import { Request, Response } from "express";
import { prisma, Prisma } from "@repo/product-db";

// Keep in sync with MAX_GALLERY_IMAGES in @repo/types.
const MAX_GALLERY_IMAGES = 8;

// Returns an error message, or null when `gallery` is a valid
// { [color]: string[] } map.
const galleryError = (gallery: unknown): string | null => {
  if (typeof gallery !== "object" || gallery === null || Array.isArray(gallery)) {
    return "Gallery must be an object of photo lists per color";
  }
  for (const [color, urls] of Object.entries(gallery)) {
    if (
      !Array.isArray(urls) ||
      urls.some((u) => typeof u !== "string" || !u.trim())
    ) {
      return `Gallery for ${color} must be a list of image URLs`;
    }
    if (urls.length > MAX_GALLERY_IMAGES) {
      return `Too many extra photos for ${color} (max ${MAX_GALLERY_IMAGES})`;
    }
  }
  return null;
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data: Prisma.ProductCreateInput = req.body;

    const { colors, images } = data;
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ message: "Colors array is required!" });
    }

    if (!images || typeof images !== "object") {
      return res.status(400).json({ message: "Images object is required!" });
    }

    const missingColors = colors.filter((color) => !(color in images));

    if (missingColors.length > 0) {
      return res
        .status(400)
        .json({ message: "Missing images for colors!", missingColors });
    }

    const gallery = (req.body as { gallery?: unknown }).gallery;
    if (gallery !== undefined) {
      const message = galleryError(gallery);
      if (message) return res.status(400).json({ message });
    }

    const product = await prisma.product.create({ data });

    return res.status(201).json(product);
  } catch (error) {
    console.error("createProduct failed:", error);
    return res.status(500).json({ message: "Failed to create product" });
  }
};

// Only these fields can be changed through the API (never id/createdAt).
const UPDATABLE_FIELDS = [
  "name",
  "shortDescription",
  "description",
  "price",
  "categorySlug",
  "sizes",
  "colors",
  "images",
  "gallery",
] as const;

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of UPDATABLE_FIELDS) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    for (const key of ["name", "shortDescription", "description"] as const) {
      if (
        key in data &&
        (typeof data[key] !== "string" || !(data[key] as string).trim())
      ) {
        return res.status(400).json({ message: `${key} cannot be empty` });
      }
    }
    if (
      typeof data.shortDescription === "string" &&
      data.shortDescription.length > 60
    ) {
      return res
        .status(400)
        .json({ message: "Short description is too long (max 60)" });
    }
    if (
      "price" in data &&
      (typeof data.price !== "number" ||
        !Number.isFinite(data.price) ||
        data.price < 1)
    ) {
      return res.status(400).json({ message: "Price must be at least 1" });
    }
    if (
      "sizes" in data &&
      (!Array.isArray(data.sizes) || data.sizes.length === 0)
    ) {
      return res.status(400).json({ message: "At least one size is required" });
    }
    if (
      "colors" in data &&
      (!Array.isArray(data.colors) || data.colors.length === 0)
    ) {
      return res.status(400).json({ message: "Colors array is required!" });
    }
    if (
      "images" in data &&
      (typeof data.images !== "object" ||
        data.images === null ||
        Array.isArray(data.images))
    ) {
      return res.status(400).json({ message: "Images object is required!" });
    }
    if ("gallery" in data) {
      const message = galleryError(data.gallery);
      if (message) return res.status(400).json({ message });
    }
    if (Array.isArray(data.colors) && data.images) {
      const images = data.images as Record<string, unknown>;
      const missingColors = (data.colors as string[]).filter(
        (color) => !images[color],
      );
      if (missingColors.length > 0) {
        return res
          .status(400)
          .json({ message: "Missing images for colors!", missingColors });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: data as unknown as Prisma.ProductUpdateInput,
    });

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("updateProduct failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return res
        .status(400)
        .json({ message: "Some product details are invalid" });
    }

    return res.status(500).json({ message: "Failed to update product" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedProduct = await prisma.product.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json(deletedProduct);
  } catch (error) {
    console.error("deleteProduct failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(500).json({ message: "Failed to delete product" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  const { sort, category, search, limit } = req.query;

  const orderBy = (() => {
    switch (sort) {
      case "asc":
        return { price: Prisma.SortOrder.asc };
      case "desc":
        return { price: Prisma.SortOrder.desc };
      case "oldest":
        return { createdAt: Prisma.SortOrder.asc };
      default:
        return { createdAt: Prisma.SortOrder.desc };
    }
  })();

  try {
    const products = await prisma.product.findMany({
      where: {
        category: category
          ? {
              slug: category as string,
            }
          : undefined,
        name: search
          ? {
              contains: search as string,
              mode: "insensitive",
            }
          : undefined,
      },
      orderBy,
      take: limit ? Number(limit) : undefined,
    });

    // A genuinely empty table returns [] with no error — nothing extra
    // needed here. This only exists so a real failure (e.g. the DB being
    // unreachable) doesn't crash the request; the client still gets a
    // usable, empty response instead of a 500 with a stack trace.
    // If products are unexpectedly empty, look for "getProducts failed" in
    // this service's logs.
    return res.status(200).json(products);
  } catch (error) {
    console.error("getProducts failed:", error);
    // 503 (not an empty 200) so the client can retry instead of showing
    // "No products found" when the database is merely slow or waking up.
    return res
      .status(503)
      .json({ message: "Products are temporarily unavailable" });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("getProduct failed:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};