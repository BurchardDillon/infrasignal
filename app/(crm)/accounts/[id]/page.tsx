import { PageHeader } from "@/components/ui/page-header";
import { AccountProfile } from "@/components/accounts/account-profile";
import { AccountEvidence } from "@/components/accounts/account-evidence";
import { AccountContacts } from "@/components/accounts/account-contacts";
import { AccountNews } from "@/components/accounts/account-news";
import { fetchAccountById } from "@/lib/supabase/queries";
import { notFound } from "next/navigation";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await fetchAccountById(id);

  if (!account) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={account.company_name} />
      <AccountProfile account={account} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccountEvidence accountId={account.id} />
        <AccountContacts accountId={account.id} />
      </div>
      <AccountNews accountId={account.id} />
    </div>
  );
}
