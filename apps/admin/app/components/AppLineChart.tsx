// Revenue per month (last 6 months): the total of successful orders.
import { getDashboardStats } from "../lib/dashboardData";
import AppLineChartClient from "./AppLineChartClient";

const AppLineChart = async () => {
  const { months, failed } = await getDashboardStats();
  return <AppLineChartClient data={months} failed={failed.orders} />;
};

export default AppLineChart;
