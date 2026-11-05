// Products in the catalogue by segment (Grocery, Pharmacy, Hardware).
import { getDashboardStats } from "../lib/dashboardData";
import AppPieChartClient from "./AppPieChartClient";

const AppPieChart = async () => {
  const { segments, failed } = await getDashboardStats();
  return <AppPieChartClient data={segments} failed={failed.products} />;
};

export default AppPieChart;
