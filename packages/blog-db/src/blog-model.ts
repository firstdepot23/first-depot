import mongoose, { type Model } from "mongoose";
const { Schema, model, models } = mongoose;

// Single source of truth for the allowed values. The admin form and the
// storefront both read these from here.
export const BlogCategories = [
  "Guides",
  "Projects",
  "Product",
  "Industry",
] as const;
export const BlogCoverVariants = ["green", "sunset", "dark", "stat"] as const;
export const BlogStatus = ["draft", "published"] as const;

export type BlogCategory = (typeof BlogCategories)[number];
export type BlogCoverVariant = (typeof BlogCoverVariants)[number];
export type BlogPostStatus = (typeof BlogStatus)[number];

export type BlogAuthor = {
  name: string;
  role: string;
  avatar?: string; // optional Cloudinary photo URL
};
export type BlogCover = {
  variant: BlogCoverVariant;
  text: string; // caption printed on the cover
  stat?: string; // big number, only used by the "stat" variant
  image?: string; // optional Cloudinary photo; replaces the gradient/stat cover
};

// Shape stored in MongoDB.
export interface BlogPostSchemaType {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  status: BlogPostStatus;
  publishedAt: Date;
  authors: BlogAuthor[];
  cover: BlogCover;
  body: string[]; // one entry per paragraph
  productIds: number[]; // products this post is about (shown on their pages)
  createdAt?: Date;
  updatedAt?: Date;
}

// JSON-safe shape handed to pages and client components (Dates as ISO strings,
// _id as a string).
export type BlogPostPlain = Omit<
  BlogPostSchemaType,
  "publishedAt" | "createdAt" | "updatedAt"
> & {
  _id: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

// What the admin form submits.
export type BlogPostInput = Omit<
  BlogPostPlain,
  "_id" | "createdAt" | "updatedAt"
>;

const AuthorSchema = new Schema<BlogAuthor>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, trim: true, default: "", maxlength: 120 },
    avatar: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const BlogPostSchema = new Schema<BlogPostSchemaType>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers and hyphens",
      ],
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    category: { type: String, required: true, enum: BlogCategories },
    status: { type: String, required: true, enum: BlogStatus, default: "draft" },
    publishedAt: { type: Date, required: true, default: Date.now },
    authors: {
      type: [AuthorSchema],
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "At least one author is required",
      },
    },
    cover: {
      variant: {
        type: String,
        required: true,
        enum: BlogCoverVariants,
        default: "green",
      },
      text: { type: String, required: true, trim: true, maxlength: 80 },
      stat: { type: String, trim: true, maxlength: 12 },
      image: { type: String, trim: true, maxlength: 500 },
    },
    body: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "The post needs at least one paragraph",
      },
    },
    productIds: { type: [Number], default: [], index: true },
  },
  { timestamps: true },
);

// The stat cover is meaningless without its number.
BlogPostSchema.pre("validate", function () {
  if (
    this.cover?.variant === "stat" &&
    !this.cover.image &&
    !this.cover.stat?.trim()
  ) {
    this.invalidate("cover.stat", "A stat is required for the stat cover");
  }
});

// Public listing: published posts, newest first, optionally per category.
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1, publishedAt: -1 });

// `models.BlogPost` guard stops "OverwriteModelError" when Next.js hot-reloads.
export const BlogPost: Model<BlogPostSchemaType> =
  (models.BlogPost as Model<BlogPostSchemaType> | undefined) ??
  model<BlogPostSchemaType>("BlogPost", BlogPostSchema);