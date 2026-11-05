// Orders and customer quote requests per month (last 6 months), from the
// database. Server part: fetches. The drawing is in AppAreaChartClient.
import { getDashboardStats } from "../lib/dashboardData";
import AppAreaChartClient from "./AppAreaChartClient";

const AppAreaChart = async () => {
  const { months, failed } = await getDashboardStats();
  return (
    <AppAreaChartClient
      data={months}
      ordersFailed={failed.orders}
      quotesFailed={failed.quotes}
    />
  );
};

export default AppAreaChart;
