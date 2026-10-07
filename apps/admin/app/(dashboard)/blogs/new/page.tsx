import Link from "next/link";
import { BlogCategories, BlogCoverVariants } from "@repo/blog-db";
import BlogForm from "../../../components/BlogForm";

const NewBlogPage = () => (
  <div>
    <div className="mb-8 rounded-md bg-secondary px-4 py-2">
      <Link
        href="/blogs"
        className="text-xs text-muted-foreground hover:underline"
      >
        Back to all posts
      </Link>
      <h1 className="font-semibold">Add Blog Post</h1>
    </div>
    <BlogForm categories={BlogCategories} variants={BlogCoverVariants} />
  </div>
);

export default NewBlogPage;
