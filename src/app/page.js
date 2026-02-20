import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import SalesChart from "@/components/dashboard/SalesChart";

export default function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <DashboardHeader />

      {/* 2. Top Stats Cards */}
      <StatCards />

      {/* 3. Graph aur Alerts Section (Responsive Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Sales Graph (Left side on PC, Top on Mobile) */}
        <SalesChart />

        {/* Expiry Alerts (Right side on PC, Bottom on Mobile) */}
        <ExpiryAlerts />
      </div>
    </div>
  );
}