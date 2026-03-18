import { PageHeader } from "@/components/ui/page-header";
import { PnLookupForm } from "@/components/pn-match/pn-lookup-form";

export const dynamic = "force-dynamic";

export default function PnMatchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="PN Match"
        description="Look up a part number to find matching accounts in your pipeline"
      />
      <PnLookupForm />
    </div>
  );
}
