import { cache } from "react";
import {
  BlogCategories,
  getPostsForProduct as getPostsForProductFromDb,
  getPublishedPostBySlug,
  getPublishedPosts,
  getRelatedPosts,
} from "@repo/blog-db";
import type { BlogPostType } from "@repo/types";

// Server-only: this reads MongoDB through @repo/blog-db. Import it from
// server components (pages), never from a "use client" file.

export type Author = BlogPostType["authors"][number];
export type CoverVariant = BlogPostType["cover"]["variant"];

// Same shape the pages and PostCover already use.
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogPostType["category"];
  date: string; // ISO date
  authors: Author[];
  cover: BlogPostType["cover"];
  body: string[];
};

export const categories: Post["category"][] = [...BlogCategories];

const toPost = (p: BlogPostType): Post => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  date: p.publishedAt,
  authors: p.authors,
  cover: p.cover,
  body: p.body,
});

export const getPosts = async (category?: Post["category"]) =>
  (await getPublishedPosts(category)).map(toPost);

// cache() so generateMetadata and the page share one database read.
export const getPost = cache(async (slug: string) => {
  const post = await getPublishedPostBySlug(slug);
  return post ? toPost(post) : undefined;
});

export const getMorePosts = async (slug: string, limit = 2) =>
  (await getRelatedPosts(slug, limit)).map(toPost);

export const getPostsForProduct = async (productId: number, limit = 2) =>
  (await getPostsForProductFromDb(productId, limit)).map(toPost);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });