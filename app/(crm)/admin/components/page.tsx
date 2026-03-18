import { PageHeader } from "@/components/ui/page-header";
import { ComponentEntryForm } from "@/components/admin/component-entry-form";

export const dynamic = "force-dynamic";

export default function AdminComponentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Component Lookups"
        description="Manually add or update part number resolutions for the PN matcher"
      />
      <ComponentEntryForm />
    </div>
  );
}
