import { PageHeader } from "@/components/ui/page-header";
import { NewsFeed } from "@/components/intelligence/news-feed";

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="News Intelligence"
        description="Market signals and hardware intelligence"
      />
      <NewsFeed />
    </div>
  );
}
