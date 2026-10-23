
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg = "#eef2ff",
  iconColor = "#3156df",
  trend,
  trendDirection = "up",
  trendColor = "green",
  description,
}) {
  const TrendIcon =
    trendDirection === "down" ? ArrowDownRight : ArrowUpRight;

  const trendColors = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex min-h-[165px] flex-col justify-between rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-app-text-secondary">
            {title}
          </p>

          <h3 className="mt-3 text-[29px] font-bold text-app-text">
            {value}
          </h3>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {Icon && <Icon size={22} strokeWidth={1.9} />}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
              trendColors[trendColor] || trendColors.green
            }`}
          >
            <TrendIcon size={13} />
            {trend}
          </span>
        )}

        {description && (
          <span className="text-[11px] text-app-text-secondary">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
