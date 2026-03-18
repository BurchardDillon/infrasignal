"use client";

import { useState, useTransition, useRef } from "react";
import { Card } from "@/components/ui/card";
import { DiscoveryResults } from "@/components/admin/discovery-results";
import { runCsvDiscovery } from "@/lib/actions/discovery-actions";
import type { DiscoveryAgentResult } from "@/lib/types";

export function CsvUploadPanel() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DiscoveryAgentResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsePreview, setParsePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null);
    setParsePreview(null);
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.trim().split("\n");
      const dataRows = lines.length > 1 ? lines.length - 1 : 0;
      setParsePreview(
        dataRows > 0
          ? `${dataRows} data row${dataRows !== 1 ? "s" : ""} detected (excluding header)`
          : "No data rows found"
      );
    };
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setResult({
        success: false,
        error: "Please select a CSV file.",
        created: 0,
        skipped_non_us: 0,
        skipped_duplicate: 0,
        total: 0,
        details: [],
      });
      return;
    }

    if (file.size === 0) {
      setResult({
        success: false,
        error: "The selected CSV file is empty.",
        created: 0,
        skipped_non_us: 0,
        skipped_duplicate: 0,
        total: 0,
        details: [],
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const csvText = reader.result as string;
      startTransition(async () => {
        const res = await runCsvDiscovery(csvText, name);
        setResult(res);
        if (res.success) {
          if (fileRef.current) fileRef.current.value = "";
          setFileName(null);
          setParsePreview(null);
          form.reset();
        }
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Upload CSV
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Upload a CSV file with company data. Required column:{" "}
            <code className="text-xs">company_name</code>. Optional:{" "}
            <code className="text-xs">domain</code>,{" "}
            <code className="text-xs">country</code>,{" "}
            <code className="text-xs">industry</code>,{" "}
            <code className="text-xs">hq_location</code>.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="csv-name"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Source Name
              </label>
              <input
                id="csv-name"
                name="name"
                type="text"
                placeholder="Q1 Target Companies"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="csv-file"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                CSV File
              </label>
              <input
                id="csv-file"
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-950 dark:file:text-indigo-300"
              />
            </div>
          </div>

          {fileName && parsePreview && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              File: {fileName} &mdash; {parsePreview}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            {isPending ? "Processing..." : "Upload & Process"}
          </button>
        </form>
      </Card>

      {result && <DiscoveryResults result={result} />}
    </div>
  );
}
