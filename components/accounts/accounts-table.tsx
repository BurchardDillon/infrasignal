"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  COMPANY_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
  EVIDENCE_STRENGTH_LABELS,
  LIKELIHOOD_LABELS,
  HARDWARE_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type {
  Account,
  AccountStatus,
  CompanyType,
  EvidenceStrength,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Badge variant maps
// ---------------------------------------------------------------------------

const STATUS_VARIANT: Record<
  AccountStatus,
  "success" | "info" | "danger" | "warning"
> = {
  active: "success",
  nurturing: "info",
  churned: "danger",
  on_hold: "warning",
};

const STRENGTH_VARIANT: Record<
  EvidenceStrength,
  "success" | "default" | "warning" | "neutral"
> = {
  strong: "success",
  moderate: "default",
  weak: "warning",
  none: "neutral",
};

// ---------------------------------------------------------------------------
// Sortable columns
// ---------------------------------------------------------------------------

type SortKey =
  | "company_name"
  | "company_type"
  | "country"
  | "status"
  | "evidence_strength"
  | "direct_buy_likelihood";

type SortDir = "asc" | "desc";

const STRENGTH_ORDER: Record<EvidenceStrength, number> = {
  strong: 4,
  moderate: 3,
  weak: 2,
  none: 1,
};

const LIKELIHOOD_ORDER: Record<string, number> = {
  high: 4,
  medium: 3,
  low: 2,
  unknown: 1,
};

function compareAccounts(a: Account, b: Account, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case "company_name":
      cmp = a.company_name.localeCompare(b.company_name);
      break;
    case "company_type":
      cmp = (COMPANY_TYPE_LABELS[a.company_type] ?? a.company_type).localeCompare(
        COMPANY_TYPE_LABELS[b.company_type] ?? b.company_type
      );
      break;
    case "country":
      cmp = a.country.localeCompare(b.country);
      break;
    case "status":
      cmp = a.status.localeCompare(b.status);
      break;
    case "evidence_strength":
      cmp = STRENGTH_ORDER[a.evidence_strength] - STRENGTH_ORDER[b.evidence_strength];
      break;
    case "direct_buy_likelihood":
      cmp =
        (LIKELIHOOD_ORDER[a.direct_buy_likelihood] ?? 0) -
        (LIKELIHOOD_ORDER[b.direct_buy_likelihood] ?? 0);
      break;
  }
  return dir === "asc" ? cmp : -cmp;
}

// ---------------------------------------------------------------------------
// Filter options derived from data
// ---------------------------------------------------------------------------

function getUniqueCountries(accounts: Account[]): string[] {
  const set = new Set(accounts.map((a) => a.country).filter(Boolean));
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("company_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const countries = useMemo(() => getUniqueCountries(accounts), [accounts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter((a) => {
      if (q) {
        const haystack = [
          a.company_name,
          a.domain,
          a.hq_location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter && a.company_type !== typeFilter) return false;
      if (countryFilter && a.country !== countryFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [accounts, search, typeFilter, countryFilter, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => compareAccounts(a, b, sortKey, sortDir));
  }, [filtered, sortKey, sortDir]);

  const hasFilters = search || typeFilter || countryFilter || statusFilter;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("");
    setCountryFilter("");
    setStatusFilter("");
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return (
        <svg className="ml-1 inline h-3 w-3 text-gray-300 dark:text-gray-600" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L9 5H3L6 2Z" />
          <path d="M6 10L3 7H9L6 10Z" />
        </svg>
      );
    }
    return (
      <svg className="ml-1 inline h-3 w-3 text-indigo-500" viewBox="0 0 12 12" fill="currentColor">
        {sortDir === "asc" ? <path d="M6 2L9 6H3L6 2Z" /> : <path d="M6 10L3 6H9L6 10Z" />}
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Company name, domain, or location..."
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Company type */}
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Company Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All Types</option>
              {(Object.entries(COMPANY_TYPE_LABELS) as [CompanyType, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Country */}
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Country
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="min-w-[130px]">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              {(Object.entries(ACCOUNT_STATUS_LABELS) as [AccountStatus, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Clear + count */}
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Showing {sorted.length} of {accounts.length} accounts
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleSort("company_name")}
              >
                Company Name
                <SortIcon column="company_name" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleSort("company_type")}
              >
                Type
                <SortIcon column="company_type" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleSort("country")}
              >
                Country
                <SortIcon column="country" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon column="status" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleSort("evidence_strength")}
              >
                Evidence
                <SortIcon column="evidence_strength" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => handleSort("direct_buy_likelihood")}
              >
                Buy Likelihood
                <SortIcon column="direct_buy_likelihood" />
              </th>
              <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                Hardware
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">
                Last Reviewed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No accounts match your filters.
                </td>
              </tr>
            ) : (
              sorted.map((account) => (
                <tr
                  key={account.id}
                  className="group hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
                    >
                      {account.company_name}
                    </Link>
                    {account.hq_location && (
                      <p className="text-[10px] text-gray-400">
                        {account.hq_location}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {COMPANY_TYPE_LABELS[account.company_type]}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {account.country}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[account.status]}>
                      {ACCOUNT_STATUS_LABELS[account.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STRENGTH_VARIANT[account.evidence_strength]}>
                      {EVIDENCE_STRENGTH_LABELS[account.evidence_strength]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {LIKELIHOOD_LABELS[account.direct_buy_likelihood]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {account.hardware_categories.map((cat) => (
                        <Badge key={cat} variant="neutral">
                          {HARDWARE_CATEGORY_LABELS[cat]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {account.last_reviewed_at
                      ? new Date(account.last_reviewed_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
