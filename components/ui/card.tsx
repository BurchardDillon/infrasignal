import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950 ${className}`}
    >
      {children}
    </div>
  );
}
