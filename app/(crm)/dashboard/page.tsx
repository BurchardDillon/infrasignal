import { PageHeader } from "@/components/ui/page-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { IntelligenceFeed } from "@/components/dashboard/intelligence-feed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Pipeline overview and recent intelligence"
      />
      <DashboardStats />
      <IntelligenceFeed />
    </div>
  );
}
