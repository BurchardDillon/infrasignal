import { PageHeader } from "@/components/ui/page-header";
import { AccountsTable } from "@/components/accounts/accounts-table";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Qualified companies in your pipeline"
      />
      <AccountsTable />
    </div>
  );
}
