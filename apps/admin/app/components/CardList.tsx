import Image from "next/image";
import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { OrderType, ProductsType } from "@repo/types";
import { auth } from "@clerk/nextjs/server";

const fetchPopularProducts = async (): Promise<ProductsType> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/products?limit=5&popular=true`,
  );

  if (!res.ok) {
    console.error(
      `Failed to fetch popular products: ${res.status} ${await res.text().catch(() => "")}`,
    );
    return [];
  }

  const data = await res.json();

  // Guard against the API returning something other than a bare array
  // (e.g. { products: [...] } or an error payload), which is what caused
  // `products.map is not a function`.
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;

  console.error("Unexpected popular products response shape:", data);
  return [];
};

const fetchOrders = async (token: string | null): Promise<OrderType[]> => {
  if (!token) {
    console.error("No auth token available for fetching orders");
    return [];
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/orders?limit=5`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    console.error(
      `Failed to fetch orders: ${res.status} ${await res.text().catch(() => "")}`,
    );
    return [];
  }

  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;

  console.error("Unexpected orders response shape:", data);
  return [];
};

const CardList = async ({ title }: { title: string }) => {
  let products: ProductsType = [];
  let orders: OrderType[] = [];

  const { getToken } = await auth();
  const token = await getToken();

  if (title === "Popular Products") {
    products = await fetchPopularProducts();
  } else {
    orders = await fetchOrders(token);
  }

  const isPopular = title === "Popular Products";
  const isEmpty = isPopular ? products.length === 0 : orders.length === 0;

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-2">
        {isEmpty && (
          <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
        )}
        {isPopular
          ? products.map((item) => (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-sm relative overflow-hidden">
                  <Image
                    src={
                      Object.values(item.images as Record<string, string>)[0] ||
                      ""
                    }
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                </CardContent>
                <CardFooter className="p-0">UGX {item.price}K</CardFooter>
              </Card>
            ))
          : orders.map((item) => (
              <Card
                key={item._id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.email}
                  </CardTitle>
                  <Badge variant="secondary">{item.status}</Badge>
                </CardContent>
                <CardFooter className="p-0">${item.amount / 100}</CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default CardList;
