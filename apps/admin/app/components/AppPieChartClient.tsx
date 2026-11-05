"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import type { SegmentStat } from "../lib/dashboardData";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const AppPieChartClient = ({
  data,
  failed,
}: {
  data: SegmentStat[];
  failed: boolean;
}) => {
  // One colour per segment, whichever segments exist.
  const chartConfig: ChartConfig = {
    count: { label: "Products" },
    ...Object.fromEntries(
      data.map((s, i) => [
        s.segment,
        { label: s.label, color: COLORS[i % COLORS.length] },
      ]),
    ),
  };

  const chartData = data.map((s) => ({
    segment: s.segment,
    count: s.count,
    fill: `var(--color-${s.segment})`,
  }));

  const total = data.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Products by Segment</h1>

      {total > 0 ? (
        <>
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="segment"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Products
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            {data.map((s, i) => (
              <div key={s.segment} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      )}

      {failed && (
        <p className="mt-3 text-center text-xs text-destructive">
          Products could not be loaded.
        </p>
      )}
    </div>
  );
};

export default AppPieChartClient;
