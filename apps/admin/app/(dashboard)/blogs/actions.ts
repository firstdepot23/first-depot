"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  BlogCategories,
  BlogCoverVariants,
  BlogStatus,
  createPost,
  deletePost,
  updatePost,
} from "@repo/blog-db";
import type { BlogPostInput } from "@repo/types";

type ActionResult = { ok: true; id: string } | { ok: false; message: string };

class UserError extends Error {}

// Only accept images that came from our Cloudinary account's delivery domain.
const cloudinaryUrl = (v?: string) =>
  v && /^https:\/\/res\.cloudinary\.com\/\S+$/.test(v.trim()) ? v.trim() : undefined;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

// Server actions are public endpoints: always re-check the caller here,
// never rely on the page being hidden.
const requireAdmin = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
  if (!userId || role !== "admin") throw new UserError("Not authorised.");
};

// Clean the raw form values and reject anything the schema would refuse,
// with a message the admin can act on.
const clean = (raw: BlogPostInput): BlogPostInput => {
  const title = raw.title?.trim() ?? "";
  const slug = slugify(raw.slug || title);
  const excerpt = raw.excerpt?.trim() ?? "";
  const body = (raw.body ?? []).map((p) => p.trim()).filter(Boolean);
  const authors = (raw.authors ?? [])
    .map((a) => ({
      name: a.name?.trim() ?? "",
      role: a.role?.trim() ?? "",
      avatar: cloudinaryUrl(a.avatar),
    }))
    .filter((a) => a.name);
  const coverText = raw.cover?.text?.trim() ?? "";
  const stat = raw.cover?.stat?.trim() ?? "";

  if (!title) throw new UserError("Title is required.");
  if (title.length > 140) throw new UserError("Title is too long (max 140).");
  if (!slug) throw new UserError("Slug is required.");
  if (!excerpt) throw new UserError("Excerpt is required.");
  if (excerpt.length > 320) throw new UserError("Excerpt is too long (max 320).");
  if (!BlogCategories.includes(raw.category)) throw new UserError("Pick a category.");
  if (!BlogStatus.includes(raw.status)) throw new UserError("Pick a status.");
  if (Number.isNaN(Date.parse(raw.publishedAt))) throw new UserError("Pick a valid publish date.");
  if (authors.length === 0) throw new UserError("Add at least one author.");
  if (body.length === 0) throw new UserError("Write at least one paragraph.");
  if (!BlogCoverVariants.includes(raw.cover?.variant)) throw new UserError("Pick a cover style.");
  if (!coverText) throw new UserError("Cover caption is required.");
  if (raw.cover.variant === "stat" && !stat && !cloudinaryUrl(raw.cover.image)) {
    throw new UserError("The stat cover needs a number, e.g. 5 or 4.3x.");
  }

  return {
    slug,
    title,
    excerpt,
    category: raw.category,
    status: raw.status,
    publishedAt: new Date(raw.publishedAt).toISOString(),
    authors: authors.map(({ avatar, ...a }) => (avatar ? { ...a, avatar } : a)),
    cover: {
      variant: raw.cover.variant,
      text: coverText,
      ...(raw.cover.variant === "stat" && stat ? { stat } : {}),
      ...(cloudinaryUrl(raw.cover.image) ? { image: cloudinaryUrl(raw.cover.image) } : {}),
    },
    body,
  };
};

const toMessage = (error: unknown) => {
  if (error instanceof UserError) return error.message;
  if ((error as { code?: number })?.code === 11000) {
    return "A post with this slug already exists. Change the slug and try again.";
  }
  // Mongoose validation errors are written for humans, so surface them.
  if ((error as { name?: string })?.name === "ValidationError") {
    return (error as Error).message;
  }
  console.error(error);
  return "Something went wrong while saving. Please try again.";
};

const run = async (fn: () => Promise<string | null>): Promise<ActionResult> => {
  try {
    await requireAdmin();
    const id = await fn();
    if (!id) throw new UserError("Post not found.");
    revalidatePath("/blogs");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
};

export const createBlogPostAction = async (raw: BlogPostInput) =>
  run(() => createPost(clean(raw)));

export const updateBlogPostAction = async (id: string, raw: BlogPostInput) =>
  run(() => updatePost(id, clean(raw)));

export const deleteBlogPostAction = async (id: string) =>
  run(async () => ((await deletePost(id)) ? id : null));