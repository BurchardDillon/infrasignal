import type { ReactNode } from "react";

const variantClasses: Record<string, string> = {
  default:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  danger:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  info:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  neutral:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
