import { PageHeader } from "@/components/ui/page-header";
import { AccountDiscoveryPanel } from "@/components/admin/account-discovery-panel";
import { supabase } from "@/lib/supabase/client";
import { getDiscoveryCounts } from "@/lib/engine/account-discovery-agent";

export const dynamic = "force-dynamic";

export default async function AccountDiscoveryPage() {
  // Fetch past discovery runs and discovery counts in parallel
  const [{ data: runs }, discoveryCounts] = await Promise.all([
    supabase
      .from("job_runs")
      .select("*")
      .like("agent_name", "account_discovery%")
      .order("started_at", { ascending: false })
      .limit(25),
    getDiscoveryCounts(),
  ]);

  const pastRuns = (runs ?? []).map((r) => {
    const row = r as unknown as {
      id: string;
      agent_name: string;
      status: string;
      started_at: string;
      summary: Record<string, unknown>;
    };
    return {
      id: row.id,
      agent_name: row.agent_name,
      status: row.status,
      started_at: row.started_at,
      summary: (row.summary || {}) as {
        search_type?: string;
        region?: string;
        total_found?: number;
        new_count?: number;
        existing_count?: number;
      },
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Discovery"
        description="Proactively search the web for new companies to add to the pipeline"
      />
      <AccountDiscoveryPanel pastRuns={pastRuns} discoveryCounts={discoveryCounts} />
    </div>
  );
}
