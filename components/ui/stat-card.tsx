import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {icon && (
          <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
