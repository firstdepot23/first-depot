import { Request, Response } from "express";
import { prisma, Prisma } from "@repo/product-db";

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

    const product = await prisma.product.create({ data });

    return res.status(201).json(product);
  } catch (error) {
    console.error("createProduct failed:", error);
    return res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Prisma.ProductUpdateInput = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data,
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