import type { ScoreBreakdown } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  breakdown: ScoreBreakdown;
}

export function ScoreBreakdownCard({ breakdown }: Props) {
  const rows: { label: string; value: string; tone?: "warn" }[] = [
    { label: "Base score (confidence)", value: `+${breakdown.base}` },
  ];
  if (breakdown.duplicateMultiplier) {
    rows.push({ label: "Duplicate today", value: `× ${breakdown.duplicateMultiplier}` });
  }
  if (breakdown.newSpeciesBonus) {
    rows.push({ label: "New species bonus", value: `+${breakdown.newSpeciesBonus}` });
  }
  if (breakdown.rareBonus) {
    rows.push({ label: "Rare species bonus", value: `+${breakdown.rareBonus}` });
  }
  if (breakdown.zooMultiplier) {
    rows.push({
      label: "Near zoo penalty",
      value: `× ${breakdown.zooMultiplier}`,
      tone: "warn",
    });
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Score breakdown
      </h3>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{r.label}</span>
            <span
              className={cn(
                "font-mono font-semibold",
                r.tone === "warn" ? "text-warning" : "text-foreground",
              )}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold text-muted-foreground">Total earned</span>
        <span className="text-3xl font-extrabold text-success">+{breakdown.total}</span>
      </div>
    </div>
  );
}