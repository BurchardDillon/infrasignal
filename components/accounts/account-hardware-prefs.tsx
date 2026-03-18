"use client";

import { useState, useEffect, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

const ACCOUNT_TYPES = [
  { value: "", label: "— Select —" },
  { value: "ai_cloud", label: "AI Cloud" },
  { value: "gpu_server_builder", label: "GPU Server Builder" },
  { value: "system_integrator", label: "System Integrator" },
  { value: "var", label: "VAR" },
  { value: "oem_odm", label: "OEM/ODM" },
  { value: "cloud_hosting", label: "Cloud/Hosting" },
  { value: "finance_hft", label: "Finance/HFT" },
  { value: "defense", label: "Defense" },
  { value: "crypto_hpc", label: "Crypto/HPC" },
  { value: "hyperscaler", label: "Hyperscaler" },
  { value: "semiconductor", label: "Semiconductor" },
  { value: "colocation", label: "Colocation" },
  { value: "research", label: "Research" },
];

const CHECKBOX_FIELDS = [
  { key: "buys_cpus", label: "CPUs" },
  { key: "buys_gpus", label: "GPUs" },
  { key: "buys_memory", label: "Memory" },
  { key: "buys_ssds", label: "SSDs/Storage" },
  { key: "buys_networking", label: "Networking" },
  { key: "buys_systems", label: "Systems" },
  { key: "buys_frus", label: "FRUs" },
] as const;

interface Prefs {
  buys_cpus: boolean;
  buys_gpus: boolean;
  buys_memory: boolean;
  buys_ssds: boolean;
  buys_networking: boolean;
  buys_systems: boolean;
  buys_frus: boolean;
  cpu_ecosystem: string[];
  gpu_ecosystem: string[];
  platforms: string[];
  account_type: string;
  notes: string;
}

const DEFAULT_PREFS: Prefs = {
  buys_cpus: false,
  buys_gpus: false,
  buys_memory: false,
  buys_ssds: false,
  buys_networking: false,
  buys_systems: false,
  buys_frus: false,
  cpu_ecosystem: [],
  gpu_ecosystem: [],
  platforms: [],
  account_type: "",
  notes: "",
};

export function AccountHardwarePrefsEditor({
  accountId,
}: {
  accountId: string;
}) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("account_hardware_prefs")
        .select("*")
        .eq("account_id", accountId)
        .single();

      if (data) {
        const d = data as unknown as Record<string, unknown>;
        setPrefs({
          buys_cpus: (d.buys_cpus as boolean) ?? false,
          buys_gpus: (d.buys_gpus as boolean) ?? false,
          buys_memory: (d.buys_memory as boolean) ?? false,
          buys_ssds: (d.buys_ssds as boolean) ?? false,
          buys_networking: (d.buys_networking as boolean) ?? false,
          buys_systems: (d.buys_systems as boolean) ?? false,
          buys_frus: (d.buys_frus as boolean) ?? false,
          cpu_ecosystem: (d.cpu_ecosystem as string[]) ?? [],
          gpu_ecosystem: (d.gpu_ecosystem as string[]) ?? [],
          platforms: (d.platforms as string[]) ?? [],
          account_type: (d.account_type as string) ?? "",
          notes: (d.notes as string) ?? "",
        });
      }
      setLoaded(true);
    }
    load();
  }, [accountId]);

  function toggleCheckbox(key: keyof Prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleArrayField(
    key: "cpu_ecosystem" | "gpu_ecosystem" | "platforms",
    value: string
  ) {
    setPrefs((p) => ({
      ...p,
      [key]: value
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    }));
  }

  function handleSave() {
    setSaveResult(null);
    startTransition(async () => {
      const { error } = await supabase.from("account_hardware_prefs").upsert(
        {
          account_id: accountId,
          buys_cpus: prefs.buys_cpus,
          buys_gpus: prefs.buys_gpus,
          buys_memory: prefs.buys_memory,
          buys_ssds: prefs.buys_ssds,
          buys_networking: prefs.buys_networking,
          buys_systems: prefs.buys_systems,
          buys_frus: prefs.buys_frus,
          cpu_ecosystem: prefs.cpu_ecosystem,
          gpu_ecosystem: prefs.gpu_ecosystem,
          platforms: prefs.platforms,
          account_type: prefs.account_type || null,
          notes: prefs.notes || null,
        } as never,
        { onConflict: "account_id" }
      );

      if (error) {
        setSaveResult({ success: false, error: error.message });
      } else {
        setSaveResult({ success: true });
      }
    });
  }

  if (!loaded) {
    return (
      <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading hardware preferences...
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Hardware Preferences
        </h3>

        {/* Buys checkboxes */}
        <div>
          <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            What does this account buy?
          </p>
          <div className="flex flex-wrap gap-3">
            {CHECKBOX_FIELDS.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={prefs[f.key]}
                  onChange={() => toggleCheckbox(f.key)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        {/* Account type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Account Type
            </label>
            <select
              value={prefs.account_type}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, account_type: e.target.value }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Array fields */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              CPU Ecosystem
            </label>
            <input
              type="text"
              value={prefs.cpu_ecosystem.join(", ")}
              onChange={(e) =>
                handleArrayField("cpu_ecosystem", e.target.value)
              }
              placeholder="amd, intel"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              GPU Ecosystem
            </label>
            <input
              type="text"
              value={prefs.gpu_ecosystem.join(", ")}
              onChange={(e) =>
                handleArrayField("gpu_ecosystem", e.target.value)
              }
              placeholder="nvidia, amd"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Platforms
            </label>
            <input
              type="text"
              value={prefs.platforms.join(", ")}
              onChange={(e) => handleArrayField("platforms", e.target.value)}
              placeholder="supermicro, dell, hpe"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Notes
          </label>
          <textarea
            value={prefs.notes}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, notes: e.target.value }))
            }
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            {isPending ? "Saving..." : "Save Preferences"}
          </button>

          {saveResult?.success && (
            <Badge variant="success">Saved</Badge>
          )}
          {saveResult && !saveResult.success && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {saveResult.error}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
