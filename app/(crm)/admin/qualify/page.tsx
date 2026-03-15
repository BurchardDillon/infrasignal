import { PageHeader } from "@/components/ui/page-header";
import { QualifyButton } from "@/components/admin/qualify-button";

export default function QualifyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualification Refresh"
        description="Recompute account and prospect qualification fields from evidence and news signals"
      />
      <QualifyButton />
    </div>
  );
}
