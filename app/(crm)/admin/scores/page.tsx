import { PageHeader } from "@/components/ui/page-header";
import { RefreshScoresButton } from "@/components/admin/refresh-scores-button";

export default function ScoresPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Refresh Prospect Scores"
        description="Recalculate priority scores incorporating recent news signals"
      />
      <RefreshScoresButton />
    </div>
  );
}
