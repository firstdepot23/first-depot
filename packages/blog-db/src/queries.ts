import { isValidObjectId, type Types } from "mongoose";
import {
  BlogPost,
  type BlogCategory,
  type BlogPostInput,
  type BlogPostPlain,
  type BlogPostSchemaType,
} from "./blog-model";
import { connectBlogDB } from "./connection";

type LeanPost = BlogPostSchemaType & { _id: Types.ObjectId };

const toPlain = (d: LeanPost): BlogPostPlain => ({
  _id: d._id.toString(),
  slug: d.slug,
  title: d.title,
  excerpt: d.excerpt,
  category: d.category,
  status: d.status,
  publishedAt: d.publishedAt.toISOString(),
  authors: d.authors.map((a) => ({
    name: a.name,
    role: a.role,
    ...(a.avatar ? { avatar: a.avatar } : {}),
  })),
  cover: {
    variant: d.cover.variant,
    text: d.cover.text,
    ...(d.cover.stat ? { stat: d.cover.stat } : {}),
    ...(d.cover.image ? { image: d.cover.image } : {}),
  },
  body: [...d.body],
  createdAt: d.createdAt?.toISOString(),
  updatedAt: d.updatedAt?.toISOString(),
});

// Live on the site: published, and the publish date has arrived
// (a future date works as "scheduled").
// `as const` keeps status as the literal "published" instead of widening it to
// `string`; mongoose 9's filter types only accept "draft" | "published" here.
const livePosts = () => ({
  status: "published" as const,
  publishedAt: { $lte: new Date() },
});

/* ------------------------------ storefront ------------------------------ */

export const getPublishedPosts = async (
  category?: BlogCategory,
  limit = 50,
): Promise<BlogPostPlain[]> => {
  await connectBlogDB();
  const rows = await BlogPost.find({
    ...livePosts(),
    ...(category ? { category } : {}),
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean<LeanPost[]>();
  return rows.map(toPlain);
};

export const getPublishedPostBySlug = async (
  slug: string,
): Promise<BlogPostPlain | null> => {
  await connectBlogDB();
  const row = await BlogPost.findOne({
    slug: slug.toLowerCase(),
    ...livePosts(),
  }).lean<LeanPost | null>();
  return row ? toPlain(row) : null;
};

export const getRelatedPosts = async (
  slug: string,
  limit = 2,
): Promise<BlogPostPlain[]> => {
  await connectBlogDB();
  const rows = await BlogPost.find({ ...livePosts(), slug: { $ne: slug } })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean<LeanPost[]>();
  return rows.map(toPlain);
};

/* -------------------------------- admin --------------------------------- */

export const getAllPosts = async (): Promise<BlogPostPlain[]> => {
  await connectBlogDB();
  const rows = await BlogPost.find({}).sort({ createdAt: -1 }).lean<LeanPost[]>();
  return rows.map(toPlain);
};

export const getPostById = async (
  id: string,
): Promise<BlogPostPlain | null> => {
  if (!isValidObjectId(id)) return null;
  await connectBlogDB();
  const row = await BlogPost.findById(id).lean<LeanPost | null>();
  return row ? toPlain(row) : null;
};

export const createPost = async (input: BlogPostInput): Promise<string> => {
  await connectBlogDB();
  const doc = await BlogPost.create({
    ...input,
    publishedAt: new Date(input.publishedAt),
  });
  return doc._id.toString();
};

// Load-then-save (rather than findByIdAndUpdate) so the schema's validators
// and hooks, such as the "stat is required" check, all run on edits too.
export const updatePost = async (
  id: string,
  input: BlogPostInput,
): Promise<string | null> => {
  if (!isValidObjectId(id)) return null;
  await connectBlogDB();
  const doc = await BlogPost.findById(id);
  if (!doc) return null;

  const { cover, ...rest } = input;
  doc.set({ ...rest, publishedAt: new Date(input.publishedAt) });
  // Missing keys (stat / image) are unset, so removing an image really removes it.
  doc.set("cover", {
    variant: cover.variant,
    text: cover.text,
    stat: cover.stat,
    image: cover.image,
  });
  await doc.save();
  return doc._id.toString();
};

export const deletePost = async (id: string): Promise<boolean> => {
  if (!isValidObjectId(id)) return false;
  await connectBlogDB();
  const res = await BlogPost.findByIdAndDelete(id);
  return !!res;
};