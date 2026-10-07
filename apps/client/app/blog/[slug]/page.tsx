import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDate, getMorePosts, getPost } from "../../lib/blog";
import { AuthorList, PostCover } from "../../components/blog/PostCover";

type Props = { params: Promise<{ slug: string }> };

// Rendered on demand, then cached and refreshed at most once a minute.
export const revalidate = 60;

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found | FIRST DEPOT" };
  return { title: `${post.title} | FIRST DEPOT`, description: post.excerpt };
};

const Chevron = ({ flip = false }: { flip?: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    className={`h-3 w-3 ${flip ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 3l5 5-5 5" />
  </svg>
);

const BlogPostPage = async ({ params }: Props) => {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const more = await getMorePosts(post.slug, 2);

  return (
    <div className="pb-8 pt-6 sm:pt-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-500"
      >
        <Chevron flip /> All posts
      </Link>

      <article className="mx-auto mt-8 max-w-3xl">
        <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600">
          {post.category}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-5xl">
          {post.title}
        </h1>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AuthorList authors={post.authors} />
          <time dateTime={post.date} className="text-sm text-gray-500">
            {formatDate(post.date)}
          </time>
        </div>

        <PostCover
          post={post}
          className="mt-10 aspect-[4/3] w-full sm:aspect-[16/10]"
        />

        <p className="mt-10 text-xl leading-relaxed text-gray-700">
          {post.excerpt}
        </p>
        <div className="mt-6 space-y-6 text-lg leading-relaxed text-gray-600">
          {post.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      {/* MORE POSTS */}
      <section className="mx-auto mt-16 max-w-3xl border-t border-gray-200 pt-10">
        <h2 className="text-xl font-semibold text-gray-900">Keep reading</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block">
                <PostCover post={p} className="aspect-[16/10] w-full" />
                <p className="mt-4 text-sm font-medium text-green-600">
                  {p.category}
                </p>
                <p className="mt-1 text-lg font-semibold leading-snug text-gray-900 group-hover:text-green-700">
                  {p.title}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default BlogPostPage;
