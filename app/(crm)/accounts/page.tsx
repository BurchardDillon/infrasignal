import { PageHeader } from "@/components/ui/page-header";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { fetchAccounts } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await fetchAccounts();

  // Serialize dates for client component
  const serialized = accounts.map((a) => ({
    ...a,
    last_reviewed_at: a.last_reviewed_at ? a.last_reviewed_at.toISOString() : null,
    created_at: a.created_at.toISOString(),
    updated_at: a.updated_at.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Qualified companies in your pipeline"
      />
      <AccountsTable accounts={serialized as never} />
    </div>
  );
}
