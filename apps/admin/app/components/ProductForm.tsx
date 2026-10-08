"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  allColors,
  MAX_GALLERY_IMAGES,
  ProductFormSchema,
  units,
  type CategoryType,
} from "@repo/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import type { ProductFormValues } from "../lib/productApi";

const fetchCategories = async (): Promise<CategoryType[]> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/categories`,
  );
  if (!res.ok) throw new Error("Failed to fetch categories!");
  return res.json();
};

type ProductFormProps = {
  defaultValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => void;
  isPending: boolean;
  submitLabel: string;
};

const ProductForm = ({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: ProductFormProps) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues,
  });

  const { data: categories, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [colorSearch, setColorSearch] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [sizeUnit, setSizeUnit] = useState<string>(units[0]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const anyUploading = Object.values(uploading).some(Boolean);

  const filteredColors = useMemo(() => {
    const term = colorSearch.trim().toLowerCase();
    if (!term) return allColors;
    return allColors.filter((c) => c.name.toLowerCase().includes(term));
  }, [colorSearch]);

  const visibleColors = colorSearch
    ? filteredColors
    : filteredColors.slice(0, 12);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "FIRST-DEPOT");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData },
    );
    const data = await res.json();

    if (!data.secure_url) {
      throw new Error(data?.error?.message ?? "Upload failed");
    }
    return data.secure_url as string;
  };

  // Cover photo: the one shown on the products page.
  const uploadImage = async (color: string, file: File) => {
    setUploading((prev) => ({ ...prev, [color]: true }));
    try {
      const url = await uploadToCloudinary(file);
      form.setValue(
        "images",
        { ...(form.getValues("images") || {}), [color]: url },
        { shouldValidate: true, shouldDirty: true },
      );
    } catch (error) {
      console.error(error);
      toast.error("Upload failed!");
    } finally {
      setUploading((prev) => ({ ...prev, [color]: false }));
    }
  };

  // Extra photos: shown on the product's own page.
  const addGalleryImages = async (color: string, files: File[]) => {
    if (files.length === 0) return;

    const existing = form.getValues("gallery")?.[color] ?? [];
    const room = MAX_GALLERY_IMAGES - existing.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_GALLERY_IMAGES} extra photos.`);
      return;
    }
    if (files.length > room) {
      toast.info(
        `Only the first ${room} photo(s) were added (max ${MAX_GALLERY_IMAGES}).`,
      );
    }

    const key = `${color}:gallery`;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const results = await Promise.allSettled(
        files.slice(0, room).map(uploadToCloudinary),
      );
      const urls = results.flatMap((r) =>
        r.status === "fulfilled" ? [r.value] : [],
      );
      const failed = results.length - urls.length;
      if (failed > 0) toast.error(`${failed} photo(s) failed to upload.`);

      // Re-read after the awaits so we don't overwrite changes made meanwhile.
      const latest = form.getValues("gallery") ?? {};
      form.setValue(
        "gallery",
        {
          ...latest,
          [color]: [...(latest[color] ?? []), ...urls].slice(
            0,
            MAX_GALLERY_IMAGES,
          ),
        },
        { shouldDirty: true },
      );
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const removeGalleryImage = (color: string, url: string) => {
    const latest = form.getValues("gallery") ?? {};
    form.setValue(
      "gallery",
      { ...latest, [color]: (latest[color] ?? []).filter((u) => u !== url) },
      { shouldDirty: true },
    );
  };

  // Swap an extra photo with the current cover.
  const makeCover = (color: string, url: string) => {
    const images = form.getValues("images") || {};
    const latest = form.getValues("gallery") ?? {};
    const oldCover = images[color];

    form.setValue(
      "images",
      { ...images, [color]: url },
      { shouldValidate: true, shouldDirty: true },
    );
    form.setValue(
      "gallery",
      {
        ...latest,
        [color]: (latest[color] ?? []).flatMap((u) =>
          u === url ? (oldCover ? [oldCover] : []) : [u],
        ),
      },
      { shouldDirty: true },
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Enter the name of the product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Enter the short description of the product (max 60 characters).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                Enter the description of the product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (UGX)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>Enter the price of the product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {categoriesError && (
          <p className="text-sm text-destructive">
            Couldn&apos;t load categories. Close this panel and try again.
          </p>
        )}
        {categories && (
          <FormField
            control={form.control}
            name="categorySlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  Pick the category of the product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="sizes"
          render={({ field }) => {
            const currentSizes: string[] = field.value || [];

            const addSize = () => {
              const trimmed = sizeValue.trim();
              if (!trimmed) return;

              // Plain numbers get the selected unit ("20" -> "20 Liters");
              // anything with letters is used as typed ("6 by 6").
              const isPlainNumber = /^\d+(\.\d+)?$/.test(trimmed);
              const newSize = isPlainNumber
                ? `${trimmed} ${sizeUnit}`
                : trimmed;

              if (!currentSizes.includes(newSize)) {
                field.onChange([...currentSizes, newSize]);
              }
              setSizeValue("");
            };

            const removeSize = (size: string) => {
              field.onChange(currentSizes.filter((s) => s !== size));
            };

            return (
              <FormItem>
                <FormLabel>Sizes</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        placeholder="e.g. 20, 6 by 6, 1 inch nail"
                        value={sizeValue}
                        onChange={(e) => setSizeValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSize();
                          }
                        }}
                        className="flex-1 min-w-[160px]"
                      />
                      <Select value={sizeUnit} onValueChange={setSizeUnit}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={addSize}>
                        Add
                      </Button>
                    </div>
                    {currentSizes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {currentSizes.map((size) => (
                          <span
                            key={size}
                            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                          >
                            {size}
                            <button
                              type="button"
                              onClick={() => removeSize(size)}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                              aria-label={`Remove ${size}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Type a number and pick a unit, or type a full custom size,
                  then click Add or press Enter.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="colors"
          render={({ field }) => {
            const selected: string[] = field.value || [];

            const toggleColor = (name: string) => {
              if (selected.includes(name)) {
                field.onChange(selected.filter((v) => v !== name));
              } else {
                field.onChange([...selected, name]);
              }
            };

            return (
              <FormItem>
                <FormLabel>Colors</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Input
                      placeholder="Search colors..."
                      value={colorSearch}
                      onChange={(e) => setColorSearch(e.target.value)}
                    />
                    {selected.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selected.map((name) => {
                          const swatch = allColors.find((c) => c.name === name);
                          return (
                            <span
                              key={name}
                              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                            >
                              {swatch && (
                                <span
                                  className="h-2 w-2 rounded-full border"
                                  style={{ backgroundColor: swatch.hex }}
                                />
                              )}
                              {name}
                              <button
                                type="button"
                                onClick={() => toggleColor(name)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                aria-label={`Remove ${name}`}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto rounded-md border p-2">
                      {visibleColors.map((color) => {
                        const isSelected = selected.includes(color.name);
                        return (
                          <button
                            type="button"
                            key={color.code}
                            onClick={() => toggleColor(color.name)}
                            className={cn(
                              "flex items-center gap-2 rounded-md border p-2 text-left text-xs transition-colors",
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-input hover:bg-accent",
                            )}
                          >
                            <span
                              className="h-4 w-4 shrink-0 rounded-full border"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="truncate">{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {!colorSearch &&
                      filteredColors.length > visibleColors.length && (
                        <p className="text-xs text-muted-foreground">
                          Showing {visibleColors.length} of{" "}
                          {filteredColors.length} colors — search to find more.
                        </p>
                      )}
                    {colorSearch && filteredColors.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No colors match &quot;{colorSearch}&quot;.
                      </p>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Search and select the available colors for the product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormDescription>
                For each color, add one cover photo (shown on the products page)
                and up to {MAX_GALLERY_IMAGES} extra photos (shown on the
                product&apos;s own page).
              </FormDescription>
              <FormControl>
                <div className="space-y-4">
                  {form.watch("colors")?.map((color) => {
                    const swatch = allColors.find((c) => c.name === color);
                    const url = field.value?.[color];
                    const extras = form.watch("gallery")?.[color] ?? [];
                    const galleryBusy = uploading[`${color}:gallery`];
                    return (
                      <div
                        className="space-y-3 rounded-md border p-3"
                        key={color}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{
                              backgroundColor: swatch?.hex ?? "#cccccc",
                            }}
                          />
                          <span className="text-sm font-medium">{color}</span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium">Cover photo</p>
                          <div className="flex items-center gap-3">
                            {url ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
                                <Image
                                  src={url}
                                  alt={`${color} preview`}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            ) : null}
                            <Input
                              type="file"
                              accept="image/*"
                              disabled={uploading[color]}
                              onChange={(e) => {
                                const input = e.currentTarget;
                                const file = input.files?.[0];
                                if (file) void uploadImage(color, file);
                                input.value = "";
                              }}
                            />
                          </div>
                          {uploading[color] ? (
                            <span className="text-sm text-muted-foreground">
                              Uploading...
                            </span>
                          ) : url ? (
                            <span className="text-sm text-green-600">
                              Image set
                            </span>
                          ) : (
                            <span className="text-sm text-red-600">
                              Required
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium">
                            More photos ({extras.length}/{MAX_GALLERY_IMAGES})
                          </p>
                          {extras.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {extras.map((extra) => (
                                <div
                                  key={extra}
                                  className="flex w-16 flex-col items-center gap-1"
                                >
                                  <div className="relative h-16 w-16">
                                    <Image
                                      src={extra}
                                      alt={`${color} extra photo`}
                                      fill
                                      sizes="64px"
                                      className="rounded-md border object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeGalleryImage(color, extra)
                                      }
                                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs leading-none text-white"
                                      aria-label="Remove photo"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => makeCover(color, extra)}
                                    className="text-[10px] text-muted-foreground underline hover:text-foreground"
                                  >
                                    Make cover
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={
                              galleryBusy || extras.length >= MAX_GALLERY_IMAGES
                            }
                            onChange={(e) => {
                              const input = e.currentTarget;
                              const files = Array.from(input.files ?? []);
                              input.value = "";
                              void addGalleryImages(color, files);
                            }}
                          />
                          {galleryBusy && (
                            <span className="text-sm text-muted-foreground">
                              Uploading...
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending || anyUploading}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : anyUploading
              ? "Uploading photos..."
              : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default ProductForm;
