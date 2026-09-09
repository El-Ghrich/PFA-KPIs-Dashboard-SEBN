import { Card } from "./ui/Card";
import { Package, Trash2, Gauge, DiamondPlus, TrendingUp } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  diffValue: string | null;
  compareDirection: "up" | "down";
  target?: number | string | null;
}

function getKpiMeta(label: string) {
  const norm = label.toLowerCase().trim();
  if (norm.includes("output")) {
    return {
      icon: <Package className="w-3.5 h-3.5" />,
      iconClass: "text-blue-600 bg-blue-50 border-blue-200/60",
    };
  }
  if (norm.includes("scrap")) {
    return {
      icon: <Trash2 className="w-3.5 h-3.5" />,
      iconClass: "text-amber-600 bg-amber-50 border-amber-200/60",
    };
  }
  if (norm.includes("oee")) {
    return {
      icon: <Gauge className="w-3.5 h-3.5" />,
      iconClass: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
    };
  }
  if (
    norm.includes("cim-1") ||
    norm.includes("cim 1") ||
    norm.includes("cim1")
  ) {
    return {
      icon: <DiamondPlus className="w-3.5 h-3.5" />,
      iconClass: "text-violet-600 bg-violet-50 border-violet-200/60",
    };
  }
  if (
    norm.includes("cim-2") ||
    norm.includes("cim 2") ||
    norm.includes("cim2")
  ) {
    return {
      icon: <DiamondPlus className="w-3.5 h-3.5" />,
      iconClass: "text-violet-600 bg-violet-50 border-violet-200/60",
    };
  }
  if (
    norm.includes("cim-3") ||
    norm.includes("cim 3") ||
    norm.includes("cim3")
  ) {
    return {
      icon: <DiamondPlus className="w-3.5 h-3.5" />,
      iconClass: "text-violet-600 bg-violet-50 border-violet-200/60",
    };
  }
  return {
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    iconClass: "text-primary bg-primary/10 border-primary/20",
  };
}

export default function KpiCard({
  label,
  value,
  unit,
  diffValue,
  compareDirection,
  target,
}: KpiCardProps) {
  const isGood = compareDirection === "up";
  const color = isGood ? "#22c55e" : "#ef4444";
  const meta = getKpiMeta(label);

  const formattedTarget =
    target != null
      ? typeof target === "number"
        ? unit === "%"
          ? `${target}%`
          : `${target.toLocaleString()} ${unit}`
        : `${target} ${unit}`
      : null;

  return (
    <Card className="flex flex-col justify-between gap-2.5 p-3.5 sm:p-5 relative overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all">
      <div className="flex flex-col gap-2">
        {/* Top row: Icon on left, Diff comparison badge on right */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${meta.iconClass}`}
          >
            {meta.icon}
          </div>
          {diffValue != null && (
            <span
              className="text-[12px] font-bold flex items-center gap-0.5 shrink-0 leading-tight px-1.5 py-0.5 rounded-md"
              style={{
                color,
                backgroundColor: isGood
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
              }}
            >
              {isGood ? (
                <svg
                  className="animate-float-up"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              ) : (
                <svg
                  className="animate-float-down"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              )}
              {diffValue}
            </span>
          )}
        </div>

        {/* Second row: KPI Label - full width, always fully visible */}
        <p
          className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80 leading-snug break-words"
          title={label}
        >
          {label}
        </p>

        {/* Third row: Value and Unit */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-2xl sm:text-[26px] font-bold text-on-surface tabular-nums leading-none">
            {value}
          </span>
          <span className="text-[12px] font-medium text-on-surface-variant/60">
            {unit}
          </span>
        </div>
      </div>

      {formattedTarget && (
        <div className="pt-2 mt-auto border-t border-border-card/40 flex items-center justify-between text-[11px]">
          <span className="text-on-surface-variant/40 font-medium uppercase tracking-wider text-[10px]">
            Target
          </span>
          <span className="text-on-surface-variant/60 font-medium tabular-nums">
            {formattedTarget}
          </span>
        </div>
      )}
    </Card>
  );
}
