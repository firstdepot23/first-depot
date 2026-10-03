"use client";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";
import { OrderChartType } from "@repo/types";
import { use, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Result } from "../lib/safeFetch";

const chartConfig = {
  total: {
    label: "Total",
    color: "var(--chart-1)",
  },
  successful: {
    label: "Successful",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const AppBarChart = ({
  dataPromise,
}: {
  dataPromise: Promise<Result<OrderChartType[]>>;
}) => {
  const result = use(dataPromise);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-lg font-medium mb-6">Total Revenue</h1>
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center"
        >
          <p className="font-medium">Unable to load revenue data</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {result.message}
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => router.refresh())}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Retrying..." : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  const chartData = result.data;

  return (
    <div>
      <h1 className="text-lg font-medium mb-6">Total Revenue</h1>
      {chartData.length === 0 ? (
        <p className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          No revenue data yet.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
            />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            <Bar
              dataKey="successful"
              fill="var(--color-successful)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
};

export default AppBarChart;
