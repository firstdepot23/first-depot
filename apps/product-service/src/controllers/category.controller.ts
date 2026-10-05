import { Prisma, prisma } from "@repo/product-db";
import { Request, Response } from "express";


const hasPrismaCode = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;


const duplicateField = (error: unknown): "slug" | "name" | undefined => {
  const text = error instanceof Error ? error.message : "";
  if (text.includes("slug")) return "slug";
  if (text.includes("name")) return "name";
  return undefined;
};

const duplicateMessage = (
  field: "slug" | "name" | undefined,
  data: { name?: unknown; slug?: unknown },
) => {
  if (field === "slug") {
    return `The slug "${String(data.slug)}" is already used by another category.`;
  }
  if (field === "name") {
    return `A category named "${String(data.name)}" already exists.`;
  }
  return "A category with this name or slug already exists.";
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const data: Prisma.CategoryCreateInput = req.body;

    if (!data?.name || !data?.slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    const category = await prisma.category.create({ data });
    return res.status(201).json(category);
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      const field = duplicateField(error);
      return res
        .status(409)
        .json({ message: duplicateMessage(field, req.body ?? {}), field });
    }

    console.error("createCategory failed:", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Prisma.CategoryUpdateInput = req.body;

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data,
    });

    return res.status(200).json(category);
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (hasPrismaCode(error, "P2002")) {
      const field = duplicateField(error);
      return res
        .status(409)
        .json({ message: duplicateMessage(field, req.body ?? {}), field });
    }

    console.error("updateCategory failed:", error);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json(category);
  } catch (error) {
    if (hasPrismaCode(error, "P2025")) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (hasPrismaCode(error, "P2003")) {
      return res.status(409).json({
        message: "Category still has products. Move or delete them first.",
      });
    }

    console.error("deleteCategory failed:", error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    return res.status(200).json(categories);
  } catch (error) {
    console.error("getCategories failed:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};