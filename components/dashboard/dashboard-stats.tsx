import { Building2, ListFilter, TrendingUp, Newspaper } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { MOCK_ACCOUNTS } from "@/lib/data/mock-accounts";
import { MOCK_PROSPECTS } from "@/lib/data/mock-prospects";
import { MOCK_EVIDENCE } from "@/lib/data/mock-evidence";
import { MOCK_NEWS } from "@/lib/data/mock-news";
import { HARDWARE_CATEGORY_LABELS } from "@/lib/constants/labels";

export function DashboardStats() {
  const totalAccounts = MOCK_ACCOUNTS.length;
  const prospectsInQueue = MOCK_PROSPECTS.filter(
    (p) => p.status === "new" || p.status === "reviewing"
  ).length;
  const newSignals = MOCK_EVIDENCE.length;
  const newsItems = MOCK_NEWS.length;

  const topProspects = [...MOCK_PROSPECTS]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Accounts"
          value={totalAccounts}
          subtitle="Active pipeline"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Prospects in Queue"
          value={prospectsInQueue}
          subtitle="New & reviewing"
          icon={<ListFilter className="h-5 w-5" />}
        />
        <StatCard
          label="New Signals"
          value={newSignals}
          subtitle="Evidence items"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="News Items"
          value={newsItems}
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
