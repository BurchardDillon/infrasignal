import { PageHeader } from "@/components/ui/page-header";
import { ProspectingQueue } from "@/components/prospecting/prospecting-queue";

export default function ProspectingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospecting Queue"
        description="Scored candidates for qualification"
      />
      <ProspectingQueue />
    </div>
  );
}
