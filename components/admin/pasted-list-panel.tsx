"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { DiscoveryResults } from "@/components/admin/discovery-results";
import { runPastedListDiscovery } from "@/lib/actions/discovery-actions";
import type { DiscoveryAgentResult } from "@/lib/types";

export function PastedListPanel() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DiscoveryAgentResult | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const text = (formData.get("companies") as string).trim();

    if (!text) {
      setResult({
        success: false,
        error: "Please enter at least one company.",
        created: 0,
        skipped_non_us: 0,
        skipped_duplicate: 0,
        total: 0,
        details: [],
      });
      return;
    }

    startTransition(async () => {
      const res = await runPastedListDiscovery(text, name);
      setResult(res);
      if (res.success) {
        form.reset();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Paste Company List
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Paste company names, one per line. You can also use tab-separated
            or comma-separated values with columns:{" "}
            <code className="text-xs">company_name, domain, country</code>.
          </p>

          <div>
            <label
              htmlFor="paste-name"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Source Name
            </label>
            <input
              id="paste-name"
              name="name"
              type="text"
              placeholder="Manual prospect list"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="paste-companies"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Companies
            </label>
            <textarea
              id="paste-companies"
              name="companies"
              rows={8}
              placeholder={`Equinix\nDigital Realty\nQTS Realty Trust\n\n— or structured —\n\nEquinix\tequinix.com\tUnited States\nDigital Realty\tdigitalrealty.com\tUnited States`}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            {isPending ? "Processing..." : "Process List"}
          </button>
        </form>
      </Card>

      {result && <DiscoveryResults result={result} />}
    </div>
  );
}
