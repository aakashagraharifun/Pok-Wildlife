import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Filter, AlertTriangle, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listAllSightings, getUserById } from "@/services/sightings";
import { BottomSheet } from "@/components/wildlife/BottomSheet";
import { UserAvatar } from "@/components/wildlife/UserAvatar";
import { formatRelativeTime, formatCoord } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { Sighting } from "@/types";

// Leaflet must run client-side only.
const MapView = lazy(() =>
  import("@/components/wildlife/MapView").then((m) => ({ default: m.MapView })),
);

export const Route = createFileRoute("/_app/explorer")({
  head: () => ({ meta: [{ title: "Explorer — Pok Wildlife" }] }),
  component: ExplorerScreen,
});

type FilterMode = "all" | "mine";

function ExplorerScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selected, setSelected] = useState<Sighting | null>(null);

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["sightings", "all"],
    queryFn: listAllSightings,
  });

  const sightings = useMemo(
    () => (filter === "mine" ? all.filter((s) => s.userId === user?.id) : all),
    [all, filter, user?.id],
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-muted safe-top">
      {/* Map */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="skeleton h-full w-full" />
        ) : (
          <Suspense fallback={<div className="skeleton h-full w-full" />}>
            <MapView
              sightings={sightings}
              onSelect={setSelected}
            />
          </Suspense>
        )}
      </div>

      {/* Top header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4">
        <div className="pointer-events-auto mx-auto flex items-center justify-between gap-3 rounded-full bg-card/95 px-4 py-2 shadow-card backdrop-blur">
          <div>
            <p className="text-xs text-muted-foreground">Explorer</p>
            <p className="text-sm font-bold text-foreground">
              {sightings.length} sighting{sightings.length === 1 ? "" : "s"}
            </p>
          </div>
          <FilterPill filter={filter} setFilter={setFilter} />
        </div>
      </div>

      {/* Bottom sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && <SightingDetail sighting={selected} />}
      </BottomSheet>
    </div>
  );
}

function FilterPill({
  filter,
  setFilter,
}: {
  filter: FilterMode;
  setFilter: (f: FilterMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary p-1 text-xs">
      <button
        onClick={() => setFilter("all")}
        className={cn(
          "rounded-full px-3 py-1.5 font-semibold transition-colors",
          filter === "all" ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
        )}
      >
        <span className="flex items-center gap-1">
          <Filter className="h-3 w-3" /> All
        </span>
      </button>
      <button
        onClick={() => setFilter("mine")}
        className={cn(
          "rounded-full px-3 py-1.5 font-semibold transition-colors",
          filter === "mine" ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
        )}
      >
        Mine
      </button>
    </div>
  );
}

function SightingDetail({ sighting }: { sighting: Sighting }) {
  const author = getUserById(sighting.userId);
  return (
    <div className="pt-2">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/20 text-4xl">
          {sighting.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-bold text-foreground">
              {sighting.speciesName}
            </h3>
            {sighting.isSuspicious && (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(sighting.confidence * 100)}% confidence ·{" "}
            {formatRelativeTime(sighting.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-primary">+{sighting.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">pts</p>
        </div>
      </div>

      {sighting.imageUrl && (
        <img
          src={sighting.imageUrl}
          alt={sighting.speciesName}
          className="mt-3 h-40 w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary p-3">
        {author ? (
          <>
            <UserAvatar name={author.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {author.name}
              </p>
              <p className="text-xs text-muted-foreground">Captured by</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown explorer</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span className="font-mono">
          {formatCoord(sighting.lat)}, {formatCoord(sighting.lng)}
        </span>
      </div>

      {sighting.isSuspicious && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/15 p-3 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-warning shrink-0" />
          <span className="text-foreground">
            Captured within 500m of a zoo. Score reduced.
          </span>
        </div>
      )}
    </div>
  );
}