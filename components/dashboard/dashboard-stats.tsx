import { Building2, ListFilter, TrendingUp, Newspaper } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { fetchDashboardStats, fetchTopProspects } from "@/lib/supabase/queries";
import { HARDWARE_CATEGORY_LABELS } from "@/lib/constants/labels";

export async function DashboardStats() {
  let stats;
  let topProspects;
  try {
    [stats, topProspects] = await Promise.all([
      fetchDashboardStats(),
      fetchTopProspects(3),
    ]);
  } catch (error) {
    console.error("[DashboardStats] Supabase fetch failed:", error);
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        Failed to load dashboard data. Check server logs for details.
        <pre className="mt-2 text-xs">{String(error)}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Accounts"
          value={stats.totalAccounts}
          subtitle="Active pipeline"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Prospects in Queue"
          value={stats.prospectsInQueue}
          subtitle="New & reviewing"
          icon={<ListFilter className="h-5 w-5" />}
        />
        <StatCard
          label="New Signals"
          value={stats.evidenceCount}
          subtitle="Evidence items"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="News Items"
          value={stats.newsCount}
          subtitle="Industry updates"
          icon={<Newspaper className="h-5 w-5" />}
        />
      </div>

      <Card>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Top Prospects
        </h3>
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {topProspects.map((prospect) => (
            <div
              key={prospect.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {prospect.company_name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {prospect.hardware_categories.map((cat) => (
                    <Badge key={cat} variant="neutral">
                      {HARDWARE_CATEGORY_LABELS[cat]}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <ScoreBar score={prospect.priority_score} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
