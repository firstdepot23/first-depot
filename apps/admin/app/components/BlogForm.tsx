"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bold,
  Camera,
  CaseUpper,
  Italic,
  Plus,
  Trash2,
  Underline,
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  BlogCategoryType,
  BlogCoverVariantType,
  BlogPostInput,
  BlogPostType,
  BlogStatusType,
} from "@repo/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  RichBody,
  applyFormat,
  blogFontFamily,
  type FormatName,
} from "./ui/richText";
// Adjust this path if your blogs folder lives somewhere else.
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "../(dashboard)/blogs/actions";

const STATUSES: readonly BlogStatusType[] = ["draft", "published"];
const MAX_IMAGE_MB = 5;

const gradients: Record<string, string> = {
  green: "from-emerald-800 via-green-600 to-lime-400",
  sunset: "from-rose-500 via-orange-500 to-amber-300",
  dark: "from-gray-950 via-gray-800 to-emerald-800",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

// Same unsigned upload the product form uses (preset "FIRST-DEPOT").
const uploadImage = async (file: File): Promise<string> => {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error("Cloudinary is not configured.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "FIRST-DEPOT");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error(data.error?.message ?? "Upload failed!");
  }
  return data.secure_url as string;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-4 rounded-lg bg-primary-foreground p-4">
    <h2 className="text-sm font-semibold">{title}</h2>
    {children}
  </section>
);

const Field = ({
  label,
  hint,
  count,
  max,
  children,
}: {
  label: string;
  hint?: string;
  count?: number;
  max?: number;
  children: ReactNode;
}) => (
  <div className="grid gap-2">
    <div className="flex items-baseline justify-between">
      <span className="text-sm font-medium">{label}</span>
      {max !== undefined && (
        <span className="text-xs text-muted-foreground">
          {count}/{max}
        </span>
      )}
    </div>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// Small stand-in for the storefront cover so the admin can see their choice.
const CoverPreview = ({
  variant,
  text,
  stat,
  image,
}: {
  variant: BlogCoverVariantType;
  text: string;
  stat: string;
  image: string;
}) => {
  if (image) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <p className="absolute inset-x-4 bottom-4 text-right text-lg font-medium leading-tight text-white">
          {text || "Cover caption"}
        </p>
      </div>
    );
  }
  if (variant === "stat") {
    return (
      <div className="flex aspect-[16/10] flex-col justify-center rounded-lg bg-green-50 p-5 dark:bg-green-950/40">
        <p className="text-6xl font-light leading-none text-green-600">
          {stat || "0"}
        </p>
        <p className="mt-3 text-sm font-medium">{text || "Cover caption"}</p>
      </div>
    );
  }
  return (
    <div
      className={`flex aspect-[16/10] items-end justify-end rounded-lg bg-gradient-to-br p-4 ${gradients[variant]}`}
    >
      <p className="text-right text-lg font-medium leading-tight text-white">
        {text || "Cover caption"}
      </p>
    </div>
  );
};

type AuthorDraft = { name: string; role: string; avatar?: string };

type Props = {
  categories: readonly BlogCategoryType[];
  variants: readonly BlogCoverVariantType[];
  post?: BlogPostType; // present when editing
};

const BlogForm = ({ categories, variants, post }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Which image is currently uploading: the cover, or an author by index.
  const [uploading, setUploading] = useState<"cover" | number | null>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body.join("\n\n") ?? "");
  const [category, setCategory] = useState<BlogCategoryType>(
    post?.category ?? categories[0]!,
  );
  const [status, setStatus] = useState<BlogStatusType>(post?.status ?? "draft");
  const [date, setDate] = useState(
    (post?.publishedAt ?? new Date().toISOString()).slice(0, 10),
  );
  const [authors, setAuthors] = useState<AuthorDraft[]>(
    post?.authors.length ? post.authors : [{ name: "", role: "" }],
  );
  const [variant, setVariant] = useState<BlogCoverVariantType>(
    post?.cover.variant ?? variants[0]!,
  );
  const [coverText, setCoverText] = useState(post?.cover.text ?? "");
  const [stat, setStat] = useState(post?.cover.stat ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover.image ?? "");

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const format = (name: FormatName) => {
    const el = bodyRef.current;
    if (!el) return;
    const next = applyFormat(el, body, name);
    setBody(next.value);
    // Restore the selection after React re-renders the textarea.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.selStart, next.selEnd);
    });
  };

  const onBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    const map: Record<string, FormatName> = {
      b: "bold",
      i: "italic",
      u: "underline",
    };
    const name = e.shiftKey && key === "k" ? "caps" : map[key];
    if (name) {
      e.preventDefault();
      format(name);
    }
  };

  const onTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const setAuthor = (i: number, patch: Partial<AuthorDraft>) =>
    setAuthors((list) =>
      list.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    );

  const pickImage = async (
    input: HTMLInputElement,
    target: "cover" | number,
  ) => {
    const file = input.files?.[0];
    input.value = ""; // lets the same file be chosen again later
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB} MB.`);
      return;
    }

    setUploading(target);
    try {
      const url = await uploadImage(file);
      if (target === "cover") setCoverImage(url);
      else setAuthor(target, { avatar: url });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed!");
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: BlogPostInput = {
      slug,
      title,
      excerpt,
      category,
      status,
      publishedAt: `${date}T00:00:00.000Z`,
      authors,
      cover: {
        variant,
        text: coverText,
        ...(variant === "stat" ? { stat } : {}),
        ...(coverImage ? { image: coverImage } : {}),
      },
      // A blank line starts a new paragraph.
      body: body.split(/\n\s*\n/),
    };

    startTransition(async () => {
      const res = post
        ? await updateBlogPostAction(post._id, input)
        : await createBlogPostAction(input);

      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(post ? "Post updated" : "Post created");
      router.push("/blogs");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      {/* MAIN COLUMN */}
      <div className="space-y-4">
        <Card title="Content">
          <Field label="Title" count={title.length} max={140}>
            <Input
              value={title}
              maxLength={140}
              required
              placeholder="How to choose the right paint for every room"
              onChange={(e) => onTitle(e.target.value)}
            />
          </Field>

          <Field
            label="Slug"
            hint={`Web address: /blog/${slug || "your-post-title"}`}
          >
            <Input
              value={slug}
              maxLength={120}
              required
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </Field>

          <Field
            label="Excerpt"
            count={excerpt.length}
            max={320}
            hint="Shown on the blog listing under the title."
          >
            <Textarea
              value={excerpt}
              maxLength={320}
              required
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </Field>

          <Field
            label="Article body"
            hint="Leave a blank line between paragraphs. Select text, then use the buttons or Ctrl/Cmd + B, I, U (Shift + K for caps)."
          >
            <div className="flex gap-1">
              {(
                [
                  ["bold", Bold, "Bold (Ctrl+B)"],
                  ["italic", Italic, "Italic (Ctrl+I)"],
                  ["underline", Underline, "Underline (Ctrl+U)"],
                  ["caps", CaseUpper, "CAPS (Ctrl+Shift+K)"],
                ] as const
              ).map(([name, Icon, label]) => (
                <Button
                  key={name}
                  type="button"
                  variant="outline"
                  size="icon"
                  title={label}
                  aria-label={label}
                  onMouseDown={(e) => e.preventDefault()} // keep the selection
                  onClick={() => format(name)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Textarea
              ref={bodyRef}
              className="min-h-72 text-lg leading-relaxed"
              style={{ fontFamily: blogFontFamily }}
              value={body}
              required
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={onBodyKeyDown}
            />
          </Field>

          {body.trim() && (
            <Field
              label="Preview"
              hint="How the article will read on the blog."
            >
              <div className="rounded-md border bg-background p-5">
                <RichBody paragraphs={body.split(/\n\s*\n/).filter(Boolean)} />
              </div>
            </Field>
          )}
        </Card>

        <Card title="Authors">
          <div className="space-y-3">
            {authors.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Photo (optional) */}
                <label
                  className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold text-muted-foreground hover:bg-accent"
                  title="Upload photo"
                >
                  {a.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : uploading === i ? (
                    "…"
                  ) : a.name ? (
                    initials(a.name)
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={`Author ${i + 1} photo`}
                    disabled={uploading !== null}
                    onChange={(e) => pickImage(e.target, i)}
                  />
                </label>
                <Input
                  value={a.name}
                  maxLength={80}
                  placeholder="Name"
                  aria-label={`Author ${i + 1} name`}
                  onChange={(e) => setAuthor(i, { name: e.target.value })}
                />
                <Input
                  value={a.role}
                  maxLength={120}
                  placeholder="Role, e.g. Interior Specialist"
                  aria-label={`Author ${i + 1} role`}
                  onChange={(e) => setAuthor(i, { role: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={authors.length === 1}
                  aria-label={`Remove author ${i + 1}`}
                  onClick={() =>
                    setAuthors((list) => list.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setAuthors((list) => [...list, { name: "", role: "" }])
            }
          >
            <Plus /> Add author
          </Button>
          <p className="text-xs text-muted-foreground">
            Click the circle to add a photo. Without one, the initials are
            shown.
          </p>
        </Card>
      </div>

      {/* SIDEBAR */}
      <div className="space-y-4 lg:sticky lg:top-20">
        <Card title="Publish">
          <Field
            label="Status"
            hint={
              status === "draft"
                ? "Drafts are hidden from the public blog."
                : "Live on the blog once the publish date arrives."
            }
          >
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as BlogStatusType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "draft" ? "Draft" : "Published"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Publish date" hint="A future date schedules the post.">
            <Input
              type="date"
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label="Category">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BlogCategoryType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={pending || uploading !== null}
              className="flex-1"
            >
              {pending
                ? "Saving…"
                : uploading !== null
                  ? "Uploading image…"
                  : post
                    ? "Save changes"
                    : "Save post"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/blogs">Cancel</Link>
            </Button>
          </div>
        </Card>

        <Card title="Cover">
          <CoverPreview
            variant={variant}
            text={coverText}
            stat={stat}
            image={coverImage}
          />

          <Field
            label="Cover image (optional)"
            hint={`JPG or PNG, up to ${MAX_IMAGE_MB} MB. With an image, the style below is not used.`}
          >
            <Input
              type="file"
              accept="image/*"
              disabled={uploading !== null}
              onChange={(e) => pickImage(e.target, "cover")}
            />
            {uploading === "cover" && (
              <p className="text-xs text-muted-foreground">Uploading…</p>
            )}
            {coverImage && uploading !== "cover" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setCoverImage("")}
              >
                Remove image
              </Button>
            )}
          </Field>

          <Field label="Style">
            <Select
              value={variant}
              onValueChange={(v) => setVariant(v as BlogCoverVariantType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v === "stat"
                      ? "Big number"
                      : v.charAt(0).toUpperCase() + v.slice(1) + " gradient"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Caption" count={coverText.length} max={80}>
            <Input
              value={coverText}
              maxLength={80}
              required
              placeholder="Choosing paint, room by room"
              onChange={(e) => setCoverText(e.target.value)}
            />
          </Field>

          {variant === "stat" && !coverImage && (
            <Field label="Number" hint="For example 5, 4.3x or 60%.">
              <Input
                value={stat}
                maxLength={12}
                required
                onChange={(e) => setStat(e.target.value)}
              />
            </Field>
          )}
        </Card>
      </div>
    </form>
  );
};

export default BlogForm;
