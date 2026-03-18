import { PageHeader } from "@/components/ui/page-header";
import { DiscoveryTabs } from "@/components/admin/discovery-tabs";
import { getSeedExpansionStats } from "@/lib/actions/discovery-actions";

export const dynamic = "force-dynamic";

export default async function CompanyDiscoveryPage() {
  const seedStats = await getSeedExpansionStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Discovery"
        description="Add companies to the prospecting pipeline via CSV upload, pasted lists, or the curated seed dataset"
      />

      <DiscoveryTabs seedStats={seedStats} />
    </div>
  );
}
