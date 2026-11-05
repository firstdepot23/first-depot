"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import type { MonthStat } from "../lib/dashboardData";

const chartConfig = {
  orders: {
    label: "Orders",
    color: "var(--chart-2)",
  },
  quotes: {
    label: "Quote requests",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const AppAreaChartClient = ({
  data,
  ordersFailed,
  quotesFailed,
}: {
  data: MonthStat[];
  ordersFailed: boolean;
  quotesFailed: boolean;
}) => {
  const hasData = data.some((m) => m.orders > 0 || m.quotes > 0);

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Orders &amp; Quote Requests</h1>

      {hasData ? (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.full ?? "")
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <defs>
              <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillQuotes" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-quotes)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-quotes)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="quotes"
              type="natural"
              fill="url(#fillQuotes)"
              fillOpacity={0.4}
              stroke="var(--color-quotes)"
              stackId="a"
            />
            <Area
              dataKey="orders"
              type="natural"
              fill="url(#fillOrders)"
              fillOpacity={0.4}
              stroke="var(--color-orders)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className="text-sm text-muted-foreground">
          No orders or quote requests in the last 6 months yet.
        </p>
      )}

      {(ordersFailed || quotesFailed) && (
        <p className="mt-3 text-xs text-destructive">
          {ordersFailed && quotesFailed
            ? "Orders and quote requests could not be loaded."
            : ordersFailed
              ? "Orders could not be loaded, so only quote requests are shown."
              : "Quote requests could not be loaded, so only orders are shown."}
        </p>
      )}
    </div>
  );
};

export default AppAreaChartClient;
