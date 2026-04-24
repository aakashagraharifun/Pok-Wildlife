import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import type { Sighting } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/formatters";

interface Props {
  sighting: Sighting;
  variant?: "horizontal" | "row";
  byName?: string;
}

export function SightingCard({ sighting, variant = "horizontal", byName }: Props) {
  if (variant === "row") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
        <SpeciesThumb emoji={sighting.emoji} suspicious={sighting.isSuspicious} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-foreground">{sighting.speciesName}</p>
            {sighting.isSuspicious && (
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {byName ? `${byName} · ` : ""}
            {formatRelativeTime(sighting.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">+{sighting.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">pts</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      to="/species/$name"
      params={{ name: sighting.speciesName }}
      className="block w-44 shrink-0 rounded-2xl bg-card p-3 shadow-card transition-transform active:scale-95"
    >
      <SpeciesThumb emoji={sighting.emoji} suspicious={sighting.isSuspicious} large />
      <p className="mt-2 truncate text-sm font-semibold text-foreground">
        {sighting.speciesName}
      </p>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(sighting.createdAt)}
        </span>
        <span className="text-sm font-bold text-primary">+{sighting.score}</span>
      </div>
    </Link>
  );
}

function SpeciesThumb({
  emoji,
  suspicious,
  large,
}: {
  emoji: string;
  suspicious: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 overflow-hidden",
        large ? "h-24 w-full text-5xl" : "h-12 w-12 text-2xl",
      )}
    >
      <span className="select-none">{emoji}</span>
      {suspicious && (
        <div className="absolute right-1 top-1 rounded-full bg-warning/95 p-0.5">
          <AlertTriangle className="h-3 w-3 text-warning-foreground" />
        </div>
      )}
    </div>
  );
}