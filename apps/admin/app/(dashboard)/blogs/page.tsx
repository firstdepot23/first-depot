import Link from "next/link";
import { getAllPosts } from "@repo/blog-db";
import type { BlogPostType } from "@repo/types";
import { Button } from "../../components/ui/button";
import { DataTable } from "../products/data-table";
import { columns } from "./columns";

const BlogsPage = async () => {
  let posts: BlogPostType[] = [];
  let error: string | null = null;

  try {
    posts = await getAllPosts();
  } catch (e) {
    console.error("Failed to load blog posts:", e);
    error =
      "We couldn't load the blog posts. Check the database connection and try again.";
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between rounded-md bg-secondary px-4 py-2">
        <h1 className="font-semibold">All Blog Posts</h1>
        <Button asChild size="sm">
          <Link href="/blogs/new">Add post</Link>
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <DataTable columns={columns} data={posts} />
      )}
    </div>
  );
};

export default BlogsPage;
