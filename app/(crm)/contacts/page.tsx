import { PageHeader } from "@/components/ui/page-header";
import { ContactsTable } from "@/components/contacts/contacts-table";

export const dynamic = "force-dynamic";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People across all accounts"
      />
      <ContactsTable />
    </div>
  );
}
