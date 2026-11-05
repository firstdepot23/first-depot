"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  CategoryFormSchema,
  SEGMENT_LABELS,
  SEGMENT_ORDER,
  type Segment,
} from "@repo/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";

type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

// An error that remembers which form field the server complained about.
class ApiError extends Error {
  status: number;
  field?: "name" | "slug";

  constructor(message: string, status: number, field?: "name" | "slug") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
  }
}

// `defaultSegment` pre-selects the segment, e.g. the sidebar's Grocery
// section opens this with GROCERY already chosen.
const AddCategory = ({
  defaultSegment = "HARDWARE",
}: {
  defaultSegment?: Segment;
}) => {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      segment: defaultSegment,
      name: "",
      slug: "",
    },
  });

  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const token = await getToken();

      let res: Response;
      try {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/categories`,
          {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch {
        // fetch itself failed: offline, server asleep, blocked by CORS...
        throw new ApiError(
          "Couldn't reach the server. Check your connection and try again.",
          0,
        );
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const serverMessage =
          typeof body?.message === "string" ? body.message : undefined;
        const field =
          body?.field === "name" || body?.field === "slug"
            ? body.field
            : undefined;

        switch (res.status) {
          case 409:
            throw new ApiError(
              serverMessage ?? "This category already exists.",
              409,
              field,
            );
          case 400:
            throw new ApiError(
              serverMessage ?? "Please check the details and try again.",
              400,
            );
          case 401:
          case 403:
            throw new ApiError(
              "You don't have permission to create categories. Try signing in again.",
              res.status,
            );
          default:
            throw new ApiError(
              "Something went wrong on our side. Please try again in a moment.",
              res.status,
            );
        }
      }
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      // Keep the segment so several categories can be added in a row.
      form.reset({ segment: form.getValues("segment"), name: "", slug: "" });
      // Any open product form should see the new category.
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // Duplicate: also mark the exact field so it's obvious what to change.
        if (error.status === 409 && error.field) {
          form.setError(
            error.field,
            { type: "server", message: error.message },
            { shouldFocus: true },
          );
        }
        toast.error(error.message);
        return;
      }
      toast.error("Failed to create category. Please try again.");
    },
  });

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Category</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            >
              <FormField
                control={form.control}
                name="segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segment</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENT_ORDER.map((segment) => (
                            <SelectItem key={segment} value={segment}>
                              {SEGMENT_LABELS[segment]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Which section this category belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter category name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter category slug.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddCategory;
