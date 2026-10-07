import type {
  BlogCategory,
  BlogCoverVariant,
  BlogPostInput as DbBlogPostInput,
  BlogPostPlain,
  BlogPostStatus,
} from "@repo/blog-db";

// JSON-safe post (dates as ISO strings, _id as string): safe to pass to
// client components.
export type BlogPostType = BlogPostPlain;

// What the admin form submits.
export type BlogPostInput = DbBlogPostInput;

export type BlogCategoryType = BlogCategory;
export type BlogCoverVariantType = BlogCoverVariant;
export type BlogStatusType = BlogPostStatus;