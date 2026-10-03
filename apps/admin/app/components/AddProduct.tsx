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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { allColors, CategoryType, ProductFormSchema, units } from "@repo/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";

const fetchCategories = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/categories`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch categories!");
  }

  return await res.json();
};

const AddProduct = () => {
  const form = useForm<z.infer<typeof ProductFormSchema>>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      price: 0,
      categorySlug: "",
      sizes: [],
      colors: [],
      images: {},
    },
  });

  const { isPending, error, data } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { getToken } = useAuth();

  const [colorSearch, setColorSearch] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [sizeUnit, setSizeUnit] = useState<string>(units[0]);

  // allColors is already sorted alphabetically by name. When searching,
  // show every match; otherwise show a manageable default handful so the
  // form isn't a wall of swatches.
  const filteredColors = useMemo(() => {
    const term = colorSearch.trim().toLowerCase();
    if (!term) return allColors;
    return allColors.filter((c) => c.name.toLowerCase().includes(term));
  }, [colorSearch]);

  const visibleColors = colorSearch
    ? filteredColors
    : filteredColors.slice(0, 12);

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof ProductFormSchema>) => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/products`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) {
        throw new Error("Failed to create product!");
      }
    },
    onSuccess: () => {
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <SheetContent>
      <ScrollArea className="h-screen">
        <SheetHeader>
          <SheetTitle className="mb-4">Add Product</SheetTitle>
          <SheetDescription asChild>
            <Form {...form}>
              <form
                className="space-y-8"
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the name of the product.
                      </FormDescription>
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
                        Enter the short description of the product.
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
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the price of the product.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {data && (
                  <FormField
                    control={form.control}
                    name="categorySlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {data.map((cat: CategoryType) => (
                                <SelectItem key={cat.id} value={cat.slug}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Enter the category of the product.
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

                      // Pure numbers get the selected unit appended
                      // ("20" -> "20 Liters"). Anything already containing
                      // letters is assumed to be a full custom entry the
                      // entrant typed themselves ("6 by 6", "1 inch nail")
                      // and is used as-is.
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
                              <Select
                                value={sizeUnit}
                                onValueChange={setSizeUnit}
                              >
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
                              <Button
                                type="button"
                                variant="outline"
                                onClick={addSize}
                              >
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
                                      className="text-muted-foreground hover:text-foreground ml-1"
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
                          Type a number and pick a unit (e.g. 20 + Liters), or
                          type a full custom size (e.g. &quot;6 by 6&quot; or
                          &quot;1 inch nail&quot;), then click Add or press
                          Enter.
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
                                  const swatch = allColors.find(
                                    (c) => c.name === name,
                                  );
                                  return (
                                    <span
                                      key={name}
                                      className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                                    >
                                      {swatch && (
                                        <span
                                          className="h-2 w-2 rounded-full border"
                                          style={{
                                            backgroundColor: swatch.hex,
                                          }}
                                        />
                                      )}
                                      {name}
                                      <button
                                        type="button"
                                        onClick={() => toggleColor(name)}
                                        className="text-muted-foreground hover:text-foreground ml-1"
                                        aria-label={`Remove ${name}`}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto rounded-md border p-2">
                              {visibleColors.map((color) => {
                                const isSelected = selected.includes(
                                  color.name,
                                );
                                return (
                                  <button
                                    type="button"
                                    key={color.code}
                                    onClick={() => toggleColor(color.name)}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md border p-2 text-xs text-left transition-colors",
                                      isSelected
                                        ? "border-primary bg-primary/10"
                                        : "border-input hover:bg-accent",
                                    )}
                                  >
                                    <span
                                      className="h-4 w-4 shrink-0 rounded-full border"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="truncate">
                                      {color.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {!colorSearch &&
                              filteredColors.length > visibleColors.length && (
                                <p className="text-xs text-muted-foreground">
                                  Showing {visibleColors.length} of{" "}
                                  {filteredColors.length} colors — search to
                                  find more.
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
                          Search and select the available colors for the
                          product.
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
                      <FormControl>
                        <div className="">
                          {form.watch("colors")?.map((color) => {
                            const swatch = allColors.find(
                              (c) => c.name === color,
                            );
                            return (
                              <div
                                className="mb-4 flex items-center gap-4"
                                key={color}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{
                                      backgroundColor: swatch?.hex ?? "#cccccc",
                                    }}
                                  />
                                  <span className="text-sm font-medium min-w-[80px]">
                                    {color}:
                                  </span>
                                </div>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        formData.append(
                                          "upload_preset",
                                          "FIRST-DEPOT",
                                        );

                                        const res = await fetch(
                                          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                                          {
                                            method: "POST",
                                            body: formData,
                                          },
                                        );
                                        const data = await res.json();

                                        if (data.secure_url) {
                                          const currentImages =
                                            form.getValues("images") || {};
                                          form.setValue("images", {
                                            ...currentImages,
                                            [color]: data.secure_url,
                                          });
                                        }
                                      } catch (error) {
                                        console.log(error);
                                        toast.error("Upload failed!");
                                      }
                                    }
                                  }}
                                />
                                {field.value?.[color] ? (
                                  <span className="text-green-600 text-sm">
                                    Image selected
                                  </span>
                                ) : (
                                  <span className="text-red-600 text-sm">
                                    Image required
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </FormControl>
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
      </ScrollArea>
    </SheetContent>
  );
};

export default AddProduct;
