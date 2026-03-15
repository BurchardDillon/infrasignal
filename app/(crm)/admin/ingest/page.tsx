import { PageHeader } from "@/components/ui/page-header";
import { IngestForm } from "@/components/admin/ingest-form";

export default function IngestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="News Ingestion"
        description="Submit raw articles for deterministic interpretation and scoring"
      />
      <IngestForm />
    </div>
  );
}
