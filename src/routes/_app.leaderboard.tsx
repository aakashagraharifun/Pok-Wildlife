import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RefreshCw, Crown, Medal, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getLeaderboard } from "@/services/sightings";
import { UserAvatar } from "@/components/wildlife/UserAvatar";
import { formatScore } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Pok Wildlife" }] }),
  component: LeaderboardScreen,
});

function LeaderboardScreen() {
  const { user } = useAuth();
  const { data: ranks = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
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
        <p className="mt-1 text-sm text-primary-foreground/80">
          Top wildlife explorers, ranked by total score.
        </p>
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
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const meta =
    rank === 1
      ? { Icon: Crown, color: "var(--gold)", text: "1" }
      : rank === 2
        ? { Icon: Medal, color: "var(--silver)", text: "2" }
        : rank === 3
          ? { Icon: Award, color: "var(--bronze)", text: "3" }
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