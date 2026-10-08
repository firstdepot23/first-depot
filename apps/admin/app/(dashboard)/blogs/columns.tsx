"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { BlogPostType } from "@repo/types";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useConfirm } from "../../components/ConfirmDialog";
import type { DataTableFeatures } from "../products/data-table";
import { deleteBlogPostAction } from "./actions";

const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL;

const RowActions = ({ post }: { post: BlogPostType }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  const onDelete = async () => {
    const confirmed = await confirm({
      title: "Delete this post?",
      message: (
        <>
          You are about to permanently delete{" "}
          <span className="font-medium text-foreground">{post.title}</span>.
          This cannot be undone.
        </>
      ),
      confirmLabel: "Yes, delete",
      cancelLabel: "No",
    });
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteBlogPostAction(post._id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Post deleted");
      router.refresh();
    });
  };

  return (
    <>
      {dialog}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={pending}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/blogs/${post._id}/edit`}>Edit post</Link>
          </DropdownMenuItem>
          {clientUrl && post.status === "published" && (
            <DropdownMenuItem asChild>
              <a
                href={`${clientUrl}/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on site
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const columns: ColumnDef<DataTableFeatures, BlogPostType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-md">
        <Link
          href={`/blogs/${row.original._id}/edit`}
          className="block truncate font-medium hover:underline"
        >
          {row.original.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          /blog/{row.original.slug}
        </p>
      </div>
    ),
  },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const published = row.original.status === "published";
      return (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            published
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
      );
    },
  },
  {
    accessorKey: "publishedAt",
    header: "Publish date",
    cell: ({ row }) =>
      new Date(row.original.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
  },
  {
    id: "actions",
    cell: ({ row }) => <RowActions post={row.original} />,
  },
];
