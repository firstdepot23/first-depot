"use server";

import { revalidatePath } from "next/cache";
import { orderFetch, readApiError } from "./order-api";
import type {
  ActionResult,
  AdminOrder,
  NewOrderInput,
  ShippingStatusType,
} from "./order-types";

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export async function updateShippingStatus(
  orderId: string,
  shippingStatus: ShippingStatusType,
): Promise<ActionResult<AdminOrder>> {
  try {
    const res = await orderFetch(`/orders/${orderId}/shipping-status`, {
      method: "PATCH",
      body: { shippingStatus },
    });
    if (!res.ok) {
      return {
        ok: false,
        error: await readApiError(res, "Could not update shipping status"),
      };
    }

    const order = (await res.json()) as AdminOrder;
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { ok: true, data: order };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function createOrder(
  input: NewOrderInput,
): Promise<ActionResult<AdminOrder>> {
  try {
    const res = await orderFetch("/orders", { method: "POST", body: input });
    if (!res.ok) {
      return {
        ok: false,
        error: await readApiError(res, "Could not create the order"),
      };
    }

    const order = (await res.json()) as AdminOrder;
    revalidatePath("/orders");
    return { ok: true, data: order };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function deleteOrders(
  ids: string[],
): Promise<ActionResult<{ deleted: number }>> {
  try {
    const res = await orderFetch("/orders", { method: "DELETE", body: { ids } });
    if (!res.ok) {
      return {
        ok: false,
        error: await readApiError(res, "Could not delete the orders"),
      };
    }

    const data = (await res.json()) as { deleted: number };
    revalidatePath("/orders");
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}