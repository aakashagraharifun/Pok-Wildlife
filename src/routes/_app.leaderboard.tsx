import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  RefreshCw,
  Crown,
  Medal,
  Award,
  Globe,
  MapPin,
  Calendar,
  History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getLeaderboardExtended,
  LeaderboardTimeframe,
  LeaderboardScope,
} from "@/services/sightings";
import { UserAvatar } from "@/components/wildlife/UserAvatar";
import { formatScore } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { getCurrentCoords } from "@/services/geolocation";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Pok Wildlife" }] }),
  component: LeaderboardScreen,
});

function LeaderboardScreen() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all-time");
  const [scope, setScope] = useState<LeaderboardScope>("worldwide");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    if (scope === "nearby") {
      getCurrentCoords().then(setCoords);
    }
  }, [scope]);

  const { data: ranks = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["leaderboard", timeframe, scope, coords],
    queryFn: () => getLeaderboardExtended(timeframe, scope, coords),
  });

  return (
    <div className="min-h-dvh pb-32 safe-top">
      <div className="bg-gradient-hero px-5 pb-12 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <h1 className="text-xl font-extrabold">Leaderboard</h1>
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Refresh"
            className="rounded-full bg-primary-foreground/15 p-2 backdrop-blur transition-transform active:scale-95"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </button>
        </div>
        
        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterButton
              active={timeframe === "all-time"}
              onClick={() => setTimeframe("all-time")}
              icon={<History className="h-3.5 w-3.5" />}
              label="All-time"
            />
            <FilterButton
              active={timeframe === "weekly"}
              onClick={() => setTimeframe("weekly")}
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Weekly"
            />
            <div className="mx-1 h-4 w-px bg-primary-foreground/20 shrink-0" />
            <FilterButton
              active={scope === "worldwide"}
              onClick={() => setScope("worldwide")}
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Worldwide"
            />
            <FilterButton
              active={scope === "nearby"}
              onClick={() => setScope("nearby")}
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Nearby"
            />
          </div>
        </div>
      </div>

      <div className="-mt-6 px-4">
        <div className="rounded-2xl bg-card p-2 shadow-elegant">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {ranks.map((u, i) => {
                const rank = i + 1;
                const me = u.id === user?.id;
                return (
                  <li
                    key={u.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3",
                      me && "bg-accent/15",
                    )}
                  >
                    <RankBadge rank={rank} />
                    <UserAvatar name={u.name} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                        {u.name}
                        {me && (
                          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Explorer</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-primary tabular-nums">
                        {formatScore(u.totalScore)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        pts
                      </p>
                    </div>
                  </li>
                );
              })}
              {ranks.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No explorers found for this filter.
                </div>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shrink-0",
        active
          ? "bg-primary-foreground text-primary shadow-lg scale-105"
          : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const meta =
    rank === 1
      ? { Icon: Crown, color: "#FFD700", text: "1" }
      : rank === 2
        ? { Icon: Medal, color: "#C0C0C0", text: "2" }
        : rank === 3
          ? { Icon: Award, color: "#CD7F32", text: "3" }
          : null;

  if (meta) {
    const { Icon, color, text } = meta;
    return (
      <div
        className="flex h-9 w-9 flex-col items-center justify-center rounded-full text-xs font-extrabold text-foreground"
        style={{ backgroundColor: color }}
        aria-label={`Rank ${rank}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px]">{text}</span>
      </div>
    );
  }
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}