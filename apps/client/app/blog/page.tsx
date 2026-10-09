import Link from "next/link";
import type { Metadata } from "next";
import { categories, formatDate, getPosts } from "../lib/blog";
import { AuthorList, PostCover } from "../components/blog/PostCover";
import { blogFontClass, blogFontStyle } from "../components/blog/blogFont";

export const metadata: Metadata = {
  title: "Blog | FIRST DEPOT",
  description:
    "Guides, project ideas and product news to help you build comfort for your home.",
};

const Chevron = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-3 w-3"
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

const BlogPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) => {
  const { category } = await searchParams;
  const active = categories.find((c) => c === category);
  const list = await getPosts(active);

  const chip = (isActive: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
    }`;

  return (
    <div className={`pb-8 ${blogFontClass}`} style={blogFontStyle}>
      {/* PAGE HEADER */}
      <header className="flex items-end justify-between gap-4 pb-6 pt-8 sm:pb-8 sm:pt-12">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
            Blog
          </h1>
          <p className="mt-3 max-w-md text-base text-gray-500">
            Guides, project ideas and product news for building comfort at home.
          </p>
        </div>
        <Link
          href="/"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-green-600 transition-colors hover:text-green-500 sm:inline-flex"
        >
          Browse the shop <Chevron />
        </Link>
      </header>

      {/* CATEGORY FILTERS */}
      <nav
        aria-label="Blog categories"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        <Link href="/blog" className={chip(!active)}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/blog?category=${c}`}
            className={chip(active === c)}
          >
            {c}
          </Link>
        ))}
      </nav>

      {/* POSTS
          Mobile: one stacked column (category, title, authors, date, cover, excerpt, link).
          md+: text on the left, date + authors and the cover on the right. */}
      <div className="mt-8 md:border-x md:border-dashed md:border-gray-200">
        {list.map((post) => (
          <article
            key={post.slug}
            className="grid grid-cols-1 border-t border-gray-200 py-10 md:grid-cols-12 md:content-start md:gap-x-10 md:px-8 md:py-14"
          >
            <p className="border-l-2 border-green-600 pl-3 text-sm font-medium text-green-600 md:col-span-5 md:row-start-1">
              {post.category}
            </p>

            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl md:col-span-5 md:row-start-2">
              <Link
                href={`/blog/${post.slug}`}
                className="hover:text-green-700"
              >
                {post.title}
              </Link>
            </h2>

            {/* Authors + date */}
            <div className="mt-6 flex flex-col gap-4 md:col-span-7 md:col-start-6 md:row-start-1 md:mt-0 md:flex-row md:justify-between md:gap-8">
              <time
                dateTime={post.date}
                className="text-sm text-gray-500 md:order-1 md:pt-3"
              >
                {formatDate(post.date)}
              </time>
              <div className="md:order-2 md:basis-3/5">
                <AuthorList authors={post.authors} />
              </div>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              tabIndex={-1}
              aria-hidden="true"
              className="mt-6 block md:col-span-7 md:col-start-6 md:row-span-3 md:row-start-2 md:mt-6"
            >
              <PostCover
                post={post}
                className="aspect-[4/3] w-full sm:aspect-[16/10] md:aspect-[5/4]"
              />
            </Link>

            <p className="mt-6 text-base leading-relaxed text-gray-600 md:col-span-5 md:row-start-3">
              {post.excerpt}
            </p>

            <Link
              href={`/blog/${post.slug}`}
              className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-green-600 transition-colors hover:text-green-500 md:col-span-5 md:row-start-4"
            >
              Read more <Chevron />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
