import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCategories, BlogCoverVariants, getPostById } from "@repo/blog-db";
import BlogForm from "../../../../components/BlogForm";

const EditBlogPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div>
      <div className="mb-8 rounded-md bg-secondary px-4 py-2">
        <Link
          href="/blogs"
          className="text-xs text-muted-foreground hover:underline"
        >
          Back to all posts
        </Link>
        <h1 className="font-semibold">Edit Blog Post</h1>
      </div>
      <BlogForm
        categories={BlogCategories}
        variants={BlogCoverVariants}
        post={post}
      />
    </div>
  );
};

export default EditBlogPage;
