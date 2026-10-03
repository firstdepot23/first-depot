import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { OrderChartType } from "@repo/types";
import AppAreaChart from "../components/AppAreaChart";
import AppBarChart from "../components/AppBarChart";
import AppPieChart from "../components/AppPieChart";
import CardList from "../components/CardList";
import TodoList from "../components/TodoList";
import { safeFetch, type Result } from "../lib/safeFetch";

const getOrderChart = async (): Promise<Result<OrderChartType[]>> => {
  const baseUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL;
  if (!baseUrl) {
    return { ok: false, message: "The order service is not configured." };
  }

  // getToken() can fail or return null when Clerk can't be reached
  // (e.g. poor internet). Don't send "Bearer null" to the API.
  let token: string | null = null;
  try {
    const { getToken } = await auth();
    token = await getToken();
  } catch (error) {
    console.error("Failed to get Clerk token:", error);
  }

  if (!token) {
    return {
      ok: false,
      message:
        "We couldn't verify your session. Check your internet connection and try again.",
    };
  }

  const result = await safeFetch<OrderChartType[]>(`${baseUrl}/order-chart`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Guard against the API returning an error object instead of an array.
  if (result.ok && !Array.isArray(result.data)) {
    console.error("Unexpected order-chart response:", result.data);
    return {
      ok: false,
      message: "The server returned unexpected data. Please try again.",
    };
  }

  return result;
};

const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-6 w-40 rounded bg-muted mb-6" />
    <div className="h-[200px] w-full rounded bg-muted" />
  </div>
);

const Homepage = () => {
  // Not awaited: the page renders immediately and the chart streams in.
  const orderChartData = getOrderChart();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        <Suspense fallback={<ChartSkeleton />}>
          <AppBarChart dataPromise={orderChartData} />
        </Suspense>
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <CardList title="Latest Transactions" />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <AppPieChart />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <TodoList />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        <AppAreaChart />
      </div>
      <div className="bg-primary-foreground p-4 rounded-lg">
        <CardList title="Popular Products" />
      </div>
    </div>
  );
};

export default Homepage;
