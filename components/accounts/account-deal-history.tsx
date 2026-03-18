"use client";

import { useState, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

interface Deal {
  id: string;
  part_number: string;
  manufacturer: string | null;
  description: string | null;
  quantity: number | null;
  direction: string;
  deal_date: string | null;
  notes: string | null;
  created_at: string;
}

const DIRECTION_VARIANT: Record<string, "success" | "info" | "warning"> = {
  buy: "success",
  sell: "info",
  rfq: "warning",
};

export function AccountDealHistory({ accountId }: { accountId: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addResult, setAddResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  async function loadDeals() {
    const { data } = await supabase
      .from("deal_history")
      .select("*")
      .eq("account_id", accountId)
      .order("deal_date", { ascending: false });
    setDeals((data ?? []) as unknown as Deal[]);
    setLoaded(true);
  }

  useEffect(() => {
    loadDeals();
  }, [accountId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddResult(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const partNumber = (fd.get("part_number") as string).trim().toUpperCase();
    const manufacturer = (fd.get("manufacturer") as string).trim() || null;
    const description = (fd.get("description") as string).trim() || null;
    const quantityStr = (fd.get("quantity") as string).trim();
    const quantity = quantityStr ? parseInt(quantityStr, 10) : null;
    const direction = fd.get("direction") as string;
    const dealDate = (fd.get("deal_date") as string) || null;
    const notes = (fd.get("notes") as string).trim() || null;

    if (!partNumber) {
      setAddResult({ success: false, error: "Part number is required." });
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.from("deal_history").insert({
        account_id: accountId,
        part_number: partNumber,
        manufacturer,
        description,
        quantity,
        direction,
        deal_date: dealDate,
        notes,
      } as never);

      if (error) {
        setAddResult({ success: false, error: error.message });
      } else {
        setAddResult({ success: true });
        form.reset();
        await loadDeals();
      }
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Deal History
        </h3>

        {/* Add deal form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Part Number *
              </label>
              <input
                name="part_number"
                type="text"
                required
                placeholder="100-000000478"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                name="description"
                type="text"
                placeholder="EPYC 9454"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="100"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Direction *
              </label>
              <select
                name="direction"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="rfq">RFQ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                name="deal_date"
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <input
                name="notes"
                type="text"
                placeholder="Optional notes"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {isPending ? "Adding..." : "Add Deal"}
            </button>
            {addResult?.success && <Badge variant="success">Added</Badge>}
            {addResult && !addResult.success && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {addResult.error}
              </span>
            )}
          </div>
        </form>

        {/* Deals table */}
        {loaded && deals.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Part Number
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Manufacturer
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Direction
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                    Qty
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-mono font-medium text-gray-900 dark:text-gray-100">
                      {d.part_number}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {d.manufacturer ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={DIRECTION_VARIANT[d.direction] ?? "neutral"}
                      >
                        {d.direction.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                      {d.quantity ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {d.deal_date ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {d.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loaded && deals.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No deal history recorded for this account.
          </p>
        )}
      </div>
    </Card>
  );
}
