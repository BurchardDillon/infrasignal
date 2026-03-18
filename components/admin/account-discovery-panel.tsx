"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscoveryCompany {
  company_name: string;
  city: string;
  state: string;
  what_they_do: string;
  company_size: "small" | "medium" | "large";
  likely_needs: string[];
  existing_account_id: string | null;
  previously_discovered: boolean;
  verified: boolean;
  verification_evidence: string | null;
  verification_url: string | null;
}

interface DiscoveryResult {
  search_type: string;
  state: string;
  companies: DiscoveryCompany[];
  new_count: number;
  existing_count: number;
  previously_discovered_count: number;
  total_discovered_in_category: number;
}

interface JobRun {
  id: string;
  agent_name: string;
  status: string;
  started_at: string;
  summary: {
    search_type?: string;
    state?: string;
    region?: string;
    total_found?: number;
    new_count?: number;
    existing_count?: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: Record<string, { label: string; description: string }> = {
  ai_gpu_cloud: { label: "AI / GPU Cloud", description: "AI/GPU cloud operators, GPU-as-a-service" },
  hpc_integrators: { label: "HPC Integrators", description: "System integrators, custom server builders" },
  data_center_buildouts: { label: "Data Center Buildouts", description: "New construction, infrastructure expansion" },
  defense_hpc: { label: "Defense / HPC", description: "Defense contractors, national labs" },
  finance_hft: { label: "Finance / HFT", description: "Hedge funds, HFT, trading infrastructure" },
  server_component_buyers: { label: "Server Component Buyers", description: "Buyers from independent distributors" },
  supermicro_customers: { label: "Supermicro Customers", description: "Supermicro server deployments" },
  amd_epyc_deployments: { label: "AMD EPYC Deployments", description: "AMD EPYC data center customers" },
  nvidia_gpu_deployments: { label: "NVIDIA GPU Deployments", description: "H100/H200/B200/L40S deployments" },
  repair_refurb_houses: { label: "Repair / Refurb Houses", description: "Repair shops, ITAD, hardware recyclers" },
  managed_service_providers: { label: "Managed Service Providers", description: "MSPs, managed hosting, IT services" },
  colocation_bare_metal: { label: "Colocation / Bare Metal", description: "Bare metal hosting, dedicated servers" },
};

const US_STATES = [
  { code: "ALL", name: "All US" },
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

const SIZE_VARIANT: Record<string, "success" | "info" | "warning"> = {
  small: "warning",
  medium: "info",
  large: "success",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountDiscoveryPanel({
  pastRuns,
  discoveryCounts,
}: {
  pastRuns: JobRun[];
  discoveryCounts: Record<string, number>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState("CA");
  const [results, setResults] = useState<DiscoveryResult | null>(null);
  const [similarResults, setSimilarResults] = useState<DiscoveryCompany[]>([]);
  const [similarFor, setSimilarFor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSimilarPending, startSimilarTransition] = useTransition();
  const [addedAccounts, setAddedAccounts] = useState<Set<string>>(new Set());
  const [addedAccountIds, setAddedAccountIds] = useState<Record<string, string>>({});
  const [verifyingCompany, setVerifyingCompany] = useState<string | null>(null);
  const [verifiedCompanies, setVerifiedCompanies] = useState<
    Record<string, { evidence: string; url: string | null; verified: boolean }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>(discoveryCounts);

  // Derive searched states from pastRuns
  const searchedStatesMap: Record<string, Set<string>> = {};
  for (const run of pastRuns) {
    const st = run.summary?.search_type;
    const state = run.summary?.state || run.summary?.region;
    if (st && state) {
      if (!searchedStatesMap[st]) searchedStatesMap[st] = new Set();
      searchedStatesMap[st].add(state);
    }
  }

  function runSearch(category: string) {
    setSelectedCategory(category);
    setResults(null);
    setSimilarResults([]);
    setSimilarFor(null);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/agents/account-discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search_type: category, state: selectedState }),
        });
        let data;
        try { data = await res.json(); } catch {
          throw new Error(`Server returned ${res.status} ${res.statusText} (no JSON body)`);
        }
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setResults(data);
        // Update live count for this category
        if (data.total_discovered_in_category !== undefined) {
          setLiveCounts((prev) => ({
            ...prev,
            [category]: data.total_discovered_in_category,
          }));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Search failed";
        setError(msg === "Failed to fetch"
          ? "Request timed out. Try again or select a different state."
          : msg);
      }
    });
  }

  function findSimilar(company: DiscoveryCompany) {
    setSimilarFor(company.company_name);
    setSimilarResults([]);

    startSimilarTransition(async () => {
      try {
        const res = await fetch("/api/agents/account-discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "find_similar",
            company_name: company.company_name,
            what_they_do: company.what_they_do,
          }),
        });
        let data;
        try { data = await res.json(); } catch {
          throw new Error(`Server returned ${res.status}`);
        }
        if (!res.ok) throw new Error(data.error || "Search failed");
        setSimilarResults(data.companies || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Similar search failed");
      }
    });
  }

  async function verifyCompany(company: DiscoveryCompany) {
    setVerifyingCompany(company.company_name);
    try {
      const res = await fetch("/api/agents/account-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          company_name: company.company_name,
          what_they_do: company.what_they_do,
        }),
      });
      let data;
      try { data = await res.json(); } catch {
        throw new Error(`Server returned ${res.status}`);
      }
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setVerifiedCompanies((prev) => ({
        ...prev,
        [company.company_name]: data,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyingCompany(null);
    }
  }

  async function addAccount(company: DiscoveryCompany) {
    try {
      const res = await fetch("/api/agents/account-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_account",
          company_name: company.company_name,
          city: company.city,
          state: company.state,
          what_they_do: company.what_they_do,
          likely_needs: company.likely_needs,
          search_type: selectedCategory,
        }),
      });
      let data;
      try { data = await res.json(); } catch {
        throw new Error(`Server returned ${res.status}`);
      }
      if (!res.ok) throw new Error(data.error || "Failed to add");

      setAddedAccounts((prev) => new Set(prev).add(company.company_name));
      setAddedAccountIds((prev) => ({
        ...prev,
        [company.company_name]: data.account_id,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add account");
    }
  }

  async function addAllNew() {
    if (!results) return;
    setBulkAdding(true);
    const newCompanies = results.companies.filter(
      (c) => !c.existing_account_id && !addedAccounts.has(c.company_name)
    );
    for (const company of newCompanies) {
      await addAccount(company);
    }
    setBulkAdding(false);
  }

  function renderCompanyRow(company: DiscoveryCompany, index: number) {
    const isAdded = addedAccounts.has(company.company_name);
    const existingId = company.existing_account_id || addedAccountIds[company.company_name];
    const verification = verifiedCompanies[company.company_name];
    const isVerifying = verifyingCompany === company.company_name;

    return (
      <tr key={`${company.company_name}-${index}`} className="group hover:bg-gray-50 dark:hover:bg-gray-900">
        <td className="px-4 py-3">
          <button
            onClick={() => findSimilar(company)}
            className="text-left font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
            title="Click to find similar companies"
          >
            {company.company_name}
          </button>
          <p className="text-[10px] text-gray-400">
            {company.city}, {company.state}
          </p>
        </td>
        <td className="max-w-[200px] px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          {company.what_they_do}
        </td>
        <td className="px-4 py-3">
          <Badge variant={SIZE_VARIANT[company.company_size] || "info"}>
            {company.company_size.charAt(0).toUpperCase() + company.company_size.slice(1)}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-0.5">
            {company.likely_needs.slice(0, 4).map((n) => (
              <span key={n} className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {n}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          {existingId ? (
            <Link href={`/accounts/${existingId}`}>
              <Badge variant="success">{isAdded ? "Added" : "In Pipeline"}</Badge>
            </Link>
          ) : company.previously_discovered ? (
            <Badge variant="default">Prev. Found</Badge>
          ) : (
            <Badge variant="info">New</Badge>
          )}
        </td>
        <td className="px-4 py-3">
          {verification ? (
            <div className="max-w-[180px]">
              <Badge variant={verification.verified ? "success" : "warning"}>
                {verification.verified ? "Verified" : "Unverified"}
              </Badge>
              {verification.url && (
                <a
                  href={verification.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block truncate text-[10px] text-blue-600 hover:underline"
                >
                  {verification.evidence.slice(0, 60)}...
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={() => verifyCompany(company)}
              disabled={isVerifying}
              className="rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400"
            >
              {isVerifying ? "..." : "Verify"}
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          {existingId ? (
            <Link href={`/accounts/${existingId}`} className="text-sm text-blue-600 hover:underline">
              View
            </Link>
          ) : (
            <button
              onClick={() => addAccount(company)}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Add
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-3 flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Search Categories</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">State:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          {selectedCategory && searchedStatesMap[selectedCategory] && (
            <span className="text-xs text-gray-500">
              {searchedStatesMap[selectedCategory].size} state{searchedStatesMap[selectedCategory].size !== 1 ? "s" : ""} searched for this category
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const statesSearched = searchedStatesMap[key]?.size || 0;
            const discoveredCount = liveCounts[key] || 0;
            return (
              <button
                key={key}
                onClick={() => runSearch(key)}
                disabled={isPending}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  selectedCategory === key
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-900"
                } ${isPending ? "opacity-50" : ""}`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.label}</p>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{cat.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  {discoveredCount > 0 && (
                    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      {discoveredCount} discovered
                    </span>
                  )}
                  {statesSearched > 0 && (
                    <span className="text-[10px] text-green-600 dark:text-green-400">
                      {statesSearched}/50 states
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Searching for {selectedCategory ? CATEGORIES[selectedCategory]?.label : "companies"} in{" "}
            {US_STATES.find((s) => s.code === selectedState)?.name || selectedState}...
          </p>
          <p className="mt-1 text-xs text-gray-400">Usually completes in 5-10 seconds</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Results */}
      {results && !isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Results: {CATEGORIES[results.search_type]?.label} —{" "}
                {US_STATES.find((s) => s.code === results.state)?.name || results.state}
              </h3>
              <p className="text-xs text-gray-500">
                Found {results.companies.length} companies ({results.new_count} new,{" "}
                {results.existing_count} in pipeline
                {results.previously_discovered_count > 0 ? `, ${results.previously_discovered_count} prev. found` : ""})
                {results.total_discovered_in_category > 0 && (
                  <> · <span className="font-medium text-blue-600 dark:text-blue-400">{results.total_discovered_in_category} total discovered in category</span></>
                )}
              </p>
            </div>
            {results.new_count > 0 && (
              <button
                onClick={addAllNew}
                disabled={bulkAdding}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {bulkAdding ? "Adding..." : `Add All New (${Math.max(0, results.new_count - addedAccounts.size)})`}
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Company</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Description</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Size</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Needs</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Verify</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {results.companies.map((company, i) => renderCompanyRow(company, i))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Similar companies */}
      {similarFor && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Companies Similar to: {similarFor}
          </h3>
          {isSimilarPending ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-950">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Finding similar companies...</p>
            </div>
          ) : similarResults.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Company</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Size</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Needs</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Verify</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                  {similarResults.map((company, i) => renderCompanyRow(company, i))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No similar companies found.</p>
          )}
        </div>
      )}

      {/* Search history */}
      {pastRuns.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Search History</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Search Type</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">State</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Found</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">New</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {pastRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(run.started_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {run.summary?.search_type ? CATEGORIES[run.summary.search_type]?.label || run.summary.search_type : run.agent_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {run.summary?.state || run.summary?.region || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{run.summary?.total_found ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{run.summary?.new_count ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={run.status === "completed" ? "success" : "warning"}>{run.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
