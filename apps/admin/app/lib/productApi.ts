import { z } from "zod";
import type { ProductFormSchema } from "@repo/types";

// Values the product form edits and the product service stores.
export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// The product's category slug (stored on the product row).
export const categorySlugOf = (product: unknown): string =>
  (product as { categorySlug?: string }).categorySlug ?? "";

const failure = async (res: Response, fallback: string): Promise<ApiError> => {
  const body = await res.json().catch(() => null);
  const serverMessage =
    typeof body?.message === "string" ? body.message : undefined;

  switch (res.status) {
    case 400:
      return new ApiError(
        serverMessage ?? "Please check the details and try again.",
        400,
      );
    case 401:
    case 403:
      return new ApiError(
        "You don't have permission to do that. Try signing in again.",
        res.status,
      );
    case 404:
      return new ApiError(
        "This product no longer exists. Refresh the page.",
        404,
      );
    default:
      return new ApiError(fallback, res.status);
  }
};

const send = async (
  path: string,
  init: RequestInit,
  token: string | null,
  fallback: string,
): Promise<void> => {
  if (!token) {
    throw new ApiError("Could not verify your session. Please sign in again.", 401);
  }

  const baseUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
  if (!baseUrl) {
    throw new ApiError("The product service is not configured.", 0);
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Generous: the service can take a while to wake up.
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0,
    );
  }

  if (!res.ok) throw await failure(res, fallback);
};

// Keeps only the photos for colors that are still selected, so removing a
// color also removes its cover and extra photos. Run before create/update.
export const cleanProductValues = (
  values: ProductFormValues,
): ProductFormValues => {
  const images = Object.fromEntries(
    values.colors
      .filter((color) => values.images[color])
      .map((color) => [color, values.images[color] as string]),
  );
  const gallery = Object.fromEntries(
    values.colors
      .filter((color) => (values.gallery?.[color]?.length ?? 0) > 0)
      .map((color) => [color, values.gallery?.[color] as string[]]),
  );
  return { ...values, images, gallery };
};

export const createProduct = (values: ProductFormValues, token: string | null) =>
  send(
    "/products",
    { method: "POST", body: JSON.stringify(values) },
    token,
    "Something went wrong while creating the product. Please try again.",
  );

export const updateProduct = (
  id: number,
  values: ProductFormValues,
  token: string | null,
) =>
  send(
    `/products/${id}`,
    { method: "PUT", body: JSON.stringify(values) },
    token,
    "Something went wrong while saving the product. Please try again.",
  );

export const deleteProduct = (id: number, token: string | null) =>
  send(
    `/products/${id}`,
    { method: "DELETE" },
    token,
    "Something went wrong while deleting the product. Please try again.",
  );

export type BulkDeleteResult = {
  deleted: number;
  failed: number;
  message?: string; // reason for the first failure
};

// Deletes every id, never stopping at the first failure, and reports how
// many worked so the UI can say exactly what happened.
export const deleteProducts = async (
  ids: number[],
  token: string | null,
): Promise<BulkDeleteResult> => {
  const results = await Promise.allSettled(ids.map((id) => deleteProduct(id, token)));

  const failures = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );
  const firstReason = failures[0]?.reason;

  return {
    deleted: results.length - failures.length,
    failed: failures.length,
    message: firstReason instanceof Error ? firstReason.message : undefined,
  };
};