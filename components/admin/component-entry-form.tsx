"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

const CATEGORIES = [
  { value: "cpu", label: "CPU" },
  { value: "gpu", label: "GPU" },
  { value: "memory", label: "Memory" },
  { value: "ssd", label: "SSD/Storage" },
  { value: "networking", label: "Networking" },
  { value: "system", label: "System" },
  { value: "fru", label: "FRU" },
  { value: "other", label: "Other" },
];

const ECOSYSTEMS = [
  { value: "", label: "— None —" },
  { value: "amd", label: "AMD" },
  { value: "intel", label: "Intel" },
  { value: "nvidia", label: "NVIDIA" },
];

interface AddResult {
  success: boolean;
  error?: string;
}

export function ComponentEntryForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AddResult | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const partNumber = (fd.get("part_number") as string).trim().toUpperCase();
    const manufacturer = (fd.get("manufacturer") as string).trim() || null;
    const description = (fd.get("description") as string).trim() || null;
    const category = (fd.get("category") as string) || null;
    const subcategory = (fd.get("subcategory") as string).trim() || null;
    const socketPlatform =
      (fd.get("socket_platform") as string).trim() || null;
    const ecosystem = (fd.get("ecosystem") as string) || null;

    if (!partNumber) {
      setResult({ success: false, error: "Part number is required." });
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.from("component_lookups").upsert(
        {
          part_number: partNumber,
          manufacturer,
          description,
          category,
          subcategory,
          socket_platform: socketPlatform,
          ecosystem,
          source: "manual",
        } as never,
        { onConflict: "part_number" }
      );

      if (error) {
        setResult({ success: false, error: error.message });
      } else {
        setResult({ success: true });
        form.reset();
      }
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Add / Update Component
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manually add a part number resolution. If the PN already exists, it
          will be updated.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Part Number *
            </label>
            <input
              name="part_number"
              type="text"
              required
              placeholder="100-000000478"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Manufacturer
            </label>
            <input
              name="manufacturer"
              type="text"
              placeholder="AMD"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              name="description"
              type="text"
              placeholder="EPYC 9454 48-Core"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              name="category"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">— Select —</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Subcategory
            </label>
            <input
              name="subcategory"
              type="text"
              placeholder="epyc, xeon, h100, ddr5..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Socket / Platform
            </label>
            <input
              name="socket_platform"
              type="text"
              placeholder="SP5, LGA4677, SXM5..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Ecosystem
            </label>
            <select
              name="ecosystem"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {ECOSYSTEMS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          {isPending ? "Saving..." : "Save Component"}
        </button>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Component saved successfully.
          </div>
        )}
        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error}
          </div>
        )}
      </form>
    </Card>
  );
}
