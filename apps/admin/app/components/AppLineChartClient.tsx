"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import type { MonthStat } from "../lib/dashboardData";

const chartConfig = {
  revenue: {
    label: "Revenue (UGX)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

// 1,200,000 -> "1.2M"
const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const AppLineChartClient = ({
  data,
  failed,
}: {
  data: MonthStat[];
  failed: boolean;
}) => {
  const hasData = data.some((m) => m.revenue > 0);

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Revenue (UGX)</h1>

      {hasData ? (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) => compact.format(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.full ?? "")
                  }
                />
              }
            />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <p className="text-sm text-muted-foreground">
          No successful orders in the last 6 months yet.
        </p>
      )}

      {failed && (
        <p className="mt-3 text-xs text-destructive">
          Orders could not be loaded, so revenue may be missing.
        </p>
      )}
    </div>
  );
};

export default AppLineChartClient;
