import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FeedSourceForm } from "@/components/admin/feed-source-form";
import { FeedSourceList } from "@/components/admin/feed-source-list";
import { FeedRefreshButton } from "@/components/admin/feed-refresh-button";
import { fetchFeedSources } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const columns = [
  { key: "name", label: "Name" },
  { key: "url", label: "Feed URL" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "last_fetched", label: "Last Fetched" },
  { key: "actions", label: "" },
];

export default async function FeedSourcesPage() {
  const feeds = await fetchFeedSources();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed Sources"
        description="Manage RSS and Atom feed sources for automated news ingestion"
      />

      <FeedSourceForm />

      <FeedRefreshButton />

      <DataTable columns={columns}>
        {feeds.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No feed sources configured yet.
            </td>
          </tr>
        ) : (
          <FeedSourceList feeds={feeds} />
        )}
      </DataTable>
    </div>
  );
}
