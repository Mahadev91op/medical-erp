import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <DashboardHeader />

      {/* 2. Top Stats Cards */}
      <StatCards />

      {/* 3. Expiry Alerts Section */}
      <ExpiryAlerts />
    </div>
  );
}