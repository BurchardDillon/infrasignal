"use client";

import { useState } from "react";
import { CsvUploadPanel } from "@/components/admin/csv-upload-panel";
import { PastedListPanel } from "@/components/admin/pasted-list-panel";
import { SeedExpansionPanel } from "@/components/admin/seed-expansion-panel";

const TABS = [
  { key: "csv", label: "CSV Upload" },
  { key: "paste", label: "Paste List" },
  { key: "seed", label: "Seed Expansion" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function DiscoveryTabs({
  seedStats,
}: {
  seedStats: { total: number; already_in_system: number; net_new: number };
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("csv");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-6" aria-label="Discovery tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "csv" && <CsvUploadPanel />}
      {activeTab === "paste" && <PastedListPanel />}
      {activeTab === "seed" && <SeedExpansionPanel initialStats={seedStats} />}
    </div>
  );
}
