import Image from "next/image";
import type { Author, Post } from "../../lib/blog";

const gradients = {
  green: "from-emerald-800 via-green-600 to-lime-400",
  sunset: "from-rose-500 via-orange-500 to-amber-300",
  dark: "from-gray-950 via-gray-800 to-emerald-800",
} as const;

/** Concentric, slightly offset outlines: a quiet line-art texture for the covers. */
const Lines = () => (
  <svg
    viewBox="0 0 200 200"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    stroke="white"
    strokeOpacity="0.35"
    strokeWidth="0.6"
    aria-hidden="true"
    className="absolute inset-0 h-full w-full"
  >
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle
        key={`c${i}`}
        cx={118 + i * 2.5}
        cy={78 + i * 2.5}
        r={34 + i * 9}
      />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <rect
        key={`r${i}`}
        x={72 + i * 3}
        y={34 + i * 3}
        width={92}
        height={92}
        rx={14}
        transform={`rotate(${i * 2.5} 118 80)`}
      />
    ))}
  </svg>
);

export const PostCover = ({
  post,
  className = "",
}: {
  post: Post;
  className?: string;
}) => {
  const { variant, text, stat, image } = post.cover;

  // A real photo wins over the generated gradient / big-number covers.
  if (image) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-gray-100 shadow-xl shadow-gray-900/10 ${className}`}
      >
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 768px) 540px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <p className="absolute inset-x-6 bottom-6 text-right text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl">
          {text}
        </p>
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div
        className={`flex flex-col justify-center rounded-xl bg-green-50 p-8 shadow-xl shadow-gray-900/10 sm:p-10 ${className}`}
      >
        <p className="text-8xl font-light leading-none tracking-tight text-green-600 sm:text-9xl">
          {stat}
        </p>
        <p className="mt-5 max-w-xs text-xl font-medium leading-snug text-gray-900 sm:text-2xl">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br shadow-xl shadow-gray-900/10 ${gradients[variant]} ${className}`}
    >
      <Lines />
      <p className="absolute inset-x-6 bottom-6 text-right text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl">
        {text}
      </p>
    </div>
  );
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

export const AuthorList = ({ authors }: { authors: Author[] }) => (
  <ul className="flex flex-wrap gap-x-8 gap-y-4">
    {authors.map((a) => (
      <li key={a.name} className="flex items-center gap-3">
        {a.avatar ? (
          <Image
            src={a.avatar}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 ring-1 ring-gray-200"
          >
            {initials(a.name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">
            {a.name}
          </span>
          <span className="block text-sm leading-snug text-gray-500">
            {a.role}
          </span>
        </span>
      </li>
    ))}
  </ul>
);
