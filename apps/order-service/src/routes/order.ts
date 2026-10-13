import { FastifyInstance } from "fastify";
import { shouldBeAdmin, shouldBeUser } from "../middleware/authMiddleware";
import {
  Order,
  DeliveryMethods,
  PaymentStatus,
  ShippingStatus,
  type PaymentStatusType,
  type ShippingStatusType,
} from "@repo/order-db";
import { startOfMonth, subMonths } from "date-fns";
import { OrderChartType } from "@repo/types";

const OBJECT_ID = /^[a-f\d]{24}$/i;

type DeliveryMethodType = (typeof DeliveryMethods)[number];

// `status` is the legacy mirror of paymentStatus (see order-model.ts).
const legacyStatus = (payment: PaymentStatusType) =>
  payment === "COMPLETED"
    ? "success"
    : payment === "PENDING"
      ? "pending"
      : "failed";

type NewOrderBody = {
  userId?: string;
  email?: string;
  shipping?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  deliveryMethod?: string;
  deliveryCity?: string;
  deliveryFee?: number;
  products?: { name?: string; quantity?: number; price?: number }[];
  paymentStatus?: string;
  paymentMethod?: string;
  shippingStatus?: string;
};

// Returns a list of problems, empty when the body is fine.
const validateNewOrder = (body: NewOrderBody | undefined): string[] => {
  const problems: string[] = [];
  if (!body) return ["Request body is missing"];

  if (!body.userId?.trim()) problems.push("userId is required");
  if (!body.email?.trim()) problems.push("email is required");

  const s = body.shipping;
  if (!s?.name?.trim()) problems.push("shipping.name is required");
  if (!s?.phone?.trim()) problems.push("shipping.phone is required");
  if (!s?.address?.trim()) problems.push("shipping.address is required");
  if (!s?.city?.trim()) problems.push("shipping.city is required");

  if (
    !body.deliveryMethod ||
    !(DeliveryMethods as readonly string[]).includes(body.deliveryMethod)
  ) {
    problems.push("deliveryMethod must be pickup or delivery");
  }
  if (body.deliveryMethod === "delivery" && !body.deliveryCity?.trim()) {
    problems.push("deliveryCity is required for delivery orders");
  }

  if (!Array.isArray(body.products) || body.products.length === 0) {
    problems.push("Add at least one product");
  } else {
    body.products.forEach((p, i) => {
      if (!p.name?.trim()) problems.push(`products[${i}].name is required`);
      if (!Number.isInteger(p.quantity) || (p.quantity as number) < 1) {
        problems.push(`products[${i}].quantity must be a whole number of 1 or more`);
      }
      if (typeof p.price !== "number" || p.price < 0) {
        problems.push(`products[${i}].price must be 0 or more`);
      }
    });
  }

  if (
    body.paymentStatus &&
    !(PaymentStatus as readonly string[]).includes(body.paymentStatus)
  ) {
    problems.push("paymentStatus is not valid");
  }
  if (
    body.shippingStatus &&
    !(ShippingStatus as readonly string[]).includes(body.shippingStatus)
  ) {
    problems.push("shippingStatus is not valid");
  }
  if (body.deliveryFee !== undefined && !(body.deliveryFee >= 0)) {
    problems.push("deliveryFee must be 0 or more");
  }

  return problems;
};

export const orderRoute = async (fastify: FastifyInstance) => {
  // The customer sees ALL their orders, including PENDING ones, so a payment
  // that is still being confirmed by Pesapal shows up straight away.
  fastify.get(
    "/user-orders",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      try {
        const orders = await Order.find({ userId: request.userId }).sort({
          createdAt: -1,
        });
        console.log(
          `user-orders: userId=${request.userId} found=${orders.length}`,
        );
        return reply.send(orders);
      } catch (error) {
        console.error("user-orders failed:", error);
        return reply.status(500).send({ message: "Failed to fetch orders" });
      }
    }
  );

  // One of the customer's own orders, for the tracking page. Filtering by
  // userId means nobody can open someone else's order by guessing its id.
  fastify.get(
    "/user-orders/:id",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!OBJECT_ID.test(id)) {
        return reply.status(404).send({ message: "Order not found" });
      }

      try {
        const order = await Order.findOne({ _id: id, userId: request.userId });
        if (!order) {
          return reply.status(404).send({ message: "Order not found" });
        }
        return reply.send(order);
      } catch (error) {
        console.error("user-orders/:id failed:", error);
        return reply.status(500).send({ message: "Failed to fetch order" });
      }
    }
  );

  // Admin views skip PENDING orders (checkouts nobody has paid for yet) and
  // checkouts that timed out or were cancelled (expiredAt). Customers still
  // see those on their own orders page.
  fastify.get(
    "/orders",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { limit } = request.query as { limit: number };
      const orders = await Order.find({
        paymentStatus: { $ne: "PENDING" },
        expiredAt: { $exists: false },
      })
        .limit(limit)
        .sort({ createdAt: -1 });
      return reply.send(orders);
    }
  );

  // One order, for the admin's detailed order page.
  fastify.get(
    "/orders/:id",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!OBJECT_ID.test(id)) {
        return reply.status(404).send({ message: "Order not found" });
      }

      try {
        const order = await Order.findById(id);
        if (!order) {
          return reply.status(404).send({ message: "Order not found" });
        }
        return reply.send(order);
      } catch (error) {
        console.error("get order failed:", error);
        return reply.status(500).send({ message: "Failed to fetch order" });
      }
    }
  );

  // Manual orders entered by an admin (phone or walk-in sales). The totals are
  // worked out here, never trusted from the form.
  fastify.post(
    "/orders",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const body = request.body as NewOrderBody | undefined;
      const problems = validateNewOrder(body);
      if (problems.length > 0 || !body) {
        return reply
          .status(400)
          .send({ message: problems[0] ?? "Invalid order", problems });
      }

      const products = (body.products ?? []).map((p) => ({
        name: (p.name as string).trim(),
        quantity: p.quantity as number,
        price: p.price as number,
      }));
      const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const deliveryFee =
        body.deliveryMethod === "delivery" ? (body.deliveryFee ?? 0) : 0;

      const paymentStatus = (body.paymentStatus ??
        "COMPLETED") as PaymentStatusType;
      // validateNewOrder already checked these two against the allowed lists.
      const shippingStatus = (body.shippingStatus ??
        "processing") as ShippingStatusType;
      const deliveryMethod = body.deliveryMethod as DeliveryMethodType;
      const now = new Date();
      const shipping = body.shipping!;

      try {
        const order = await Order.create({
          userId: (body.userId as string).trim(),
          email: (body.email as string).trim(),
          amount: subtotal + deliveryFee,
          subtotal,
          deliveryFee,
          currency: "UGX",
          deliveryMethod,
          deliveryCity:
            deliveryMethod === "delivery"
              ? body.deliveryCity?.trim().toLowerCase()
              : undefined,
          shipping: {
            name: shipping.name?.trim(),
            email: shipping.email?.trim() || (body.email as string).trim(),
            phone: shipping.phone?.trim(),
            address: shipping.address?.trim(),
            city: shipping.city?.trim(),
          },
          products,
          merchantReference: `ADM-${Date.now().toString(36).toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`,
          paymentStatus,
          paymentMethod: body.paymentMethod?.trim() || undefined,
          paidAt: paymentStatus === "COMPLETED" ? now : undefined,
          status: legacyStatus(paymentStatus),
          shippingStatus,
          shippingUpdatedAt: now,
          shippingHistory: [
            { status: shippingStatus, changedAt: now, changedBy: request.userId },
          ],
          // Manual orders have no storefront cart to empty and need no
          // confirmation email from the payment flow.
          cartCleared: true,
          confirmationSent: true,
        });

        return reply.status(201).send(order);
      } catch (error) {
        console.error("create order failed:", error);
        return reply.status(500).send({ message: "Failed to create order" });
      }
    }
  );

  // Deletes the orders the admin selected in the table. Ids are checked and
  // capped so a bad request can't wipe more than intended.
  fastify.delete(
    "/orders",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { ids } = (request.body ?? {}) as { ids?: unknown };

      if (
        !Array.isArray(ids) ||
        ids.length === 0 ||
        ids.length > 100 ||
        !ids.every((id) => typeof id === "string" && OBJECT_ID.test(id))
      ) {
        return reply
          .status(400)
          .send({ message: "Send between 1 and 100 valid order ids" });
      }

      try {
        const result = await Order.deleteMany({ _id: { $in: ids } });
        console.log(
          `delete orders: admin=${request.userId} requested=${ids.length} deleted=${result.deletedCount}`,
        );
        return reply.send({ deleted: result.deletedCount });
      } catch (error) {
        console.error("delete orders failed:", error);
        return reply.status(500).send({ message: "Failed to delete orders" });
      }
    }
  );

  // The admin moves an order along: processing -> shipped -> at_station ->
  // delivered. Any step can be picked, so a mistake can be corrected.
  fastify.patch(
    "/orders/:id/shipping-status",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { shippingStatus: requested } = (request.body ?? {}) as {
        shippingStatus?: string;
      };

      if (!OBJECT_ID.test(id)) {
        return reply.status(404).send({ message: "Order not found" });
      }
      if (
        !requested ||
        !(ShippingStatus as readonly string[]).includes(requested)
      ) {
        return reply.status(400).send({
          message: `shippingStatus must be one of: ${ShippingStatus.join(", ")}`,
        });
      }
      const shippingStatus = requested as ShippingStatusType;

      try {
        const existing = await Order.findById(id);
        if (!existing) {
          return reply.status(404).send({ message: "Order not found" });
        }
        if (existing.status !== "success") {
          return reply
            .status(409)
            .send({ message: "Only paid orders can be shipped" });
        }
        // Nothing to change, so don't add a duplicate history entry.
        if (existing.shippingStatus === shippingStatus) {
          return reply.send(existing);
        }

        const now = new Date();
        const updated = await Order.findByIdAndUpdate(
          id,
          {
            $set: { shippingStatus, shippingUpdatedAt: now },
            $push: {
              shippingHistory: {
                status: shippingStatus,
                changedAt: now,
                changedBy: request.userId,
              },
            },
          },
          { new: true },
        );
        return reply.send(updated);
      } catch (error) {
        console.error("update shipping status failed:", error);
        return reply
          .status(500)
          .send({ message: "Failed to update shipping status" });
      }
    }
  );

  fastify.get(
    "/order-chart",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      // { month: "April", total: 173, successful: 100 }

      const raw = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo, $lte: now },
            paymentStatus: { $ne: "PENDING" },
            expiredAt: { $exists: false },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: 1 },
            successful: {
              // `status` is kept in sync with Pesapal's paymentStatus
              // (COMPLETED -> "success"), and old orders already use it.
              $sum: {
                $cond: [{ $eq: ["$status", "success"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            total: 1,
            successful: 1,
          },
        },
        {
          $sort: { year: 1, month: 1 },
        },
      ]);

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const results: OrderChartType[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;

        const match = raw.find(
          (item) => item.year === year && item.month === month
        );

        results.push({
          month: monthNames[month - 1] as string,
          total: match ? match.total : 0,
          successful: match ? match.successful : 0,
        });
      }

      return reply.send(results);
    }
  );
};