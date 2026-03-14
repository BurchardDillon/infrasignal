function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500 dark:bg-green-400";
  if (score >= 40) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
}

export function ScoreBar({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${height} w-full max-w-[120px] overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700`}
      >
        <div
          className={`${height} rounded-full ${getScoreColor(clamped)} transition-all`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400">
        {clamped}
      </span>
    </div>
  );
}
