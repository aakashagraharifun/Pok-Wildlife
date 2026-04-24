import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Camera, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listAllSightings, listUserSightings, getLeaderboard } from "@/services/sightings";
import { UserAvatar } from "@/components/wildlife/UserAvatar";
import { SightingCard } from "@/components/wildlife/SightingCard";
import { formatScore } from "@/utils/formatters";
import { getUserById } from "@/services/sightings";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home — Pok Wildlife" }] }),
  component: HomeScreen,
});

function HomeScreen() {
  const { user } = useAuth();
  const { data: mySightings = [], isLoading: loadingMine } = useQuery({
    queryKey: ["sightings", "user", user?.id],
    queryFn: () => listUserSightings(user!.id),
    enabled: !!user,
  });
  const { data: allSightings = [], isLoading: loadingAll } = useQuery({
    queryKey: ["sightings", "all"],
    queryFn: listAllSightings,
  });

  if (!user) return null;

  const recentGlobal = allSightings.slice(0, 8);

  return (
    <div className="min-h-dvh pb-32 safe-top">
      {/* Hero */}
      <div className="bg-gradient-hero px-5 pb-16 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} size={44} />
            <div>
              <p className="text-xs opacity-80">Welcome back,</p>
              <p className="text-base font-semibold">{user.name}</p>
            </div>
          </div>
          <Sparkles className="h-5 w-5 opacity-80" />
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest opacity-80">Total score</p>
          <p className="mt-1 text-6xl font-extrabold tracking-tight tabular-nums">
            {formatScore(user.totalScore)}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {mySightings.length} sighting{mySightings.length === 1 ? "" : "s"} captured
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="-mt-10 px-5">
        <Link
          to="/capture"
          className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-elegant"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-amber">
              <Camera className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Capture wildlife</p>
              <p className="text-xs text-muted-foreground">
                Spot a creature? Snap & identify.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {/* My recent sightings */}
      <Section
        title="Your recent sightings"
        empty="You haven't captured anything yet — head outside!"
        loading={loadingMine}
        items={mySightings.slice(0, 8)}
      />

      {/* Community feed */}
      <Section
        title="Community feed"
        empty="Nothing here yet."
        loading={loadingAll}
        items={recentGlobal}
        showAuthor
      />

      {/* Tips & Tricks */}
      <section className="mt-8 px-5">
        <h2 className="mb-3 text-base font-bold text-foreground">Wildlife Tips</h2>
        <div className="grid grid-cols-2 gap-3">
          <TipCard
            emoji="📸"
            title="Get Closer"
            desc="Better zoom means higher confidence."
          />
          <TipCard
            emoji="🌿"
            title="Find Parks"
            desc="Earn +25 bonus points in public parks."
          />
        </div>
      </section>

      {/* Leaderboard summary */}
      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Top Explorers</h2>
          <Link to="/leaderboard" className="text-xs font-bold text-primary flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <MiniLeaderboard />
      </section>
    </div>
  );
}

function MiniLeaderboard() {
  const { data: ranks = [], isLoading } = useQuery({
    queryKey: ["leaderboard", "top-3"],
    queryFn: () => getLeaderboard(),
  });

  if (isLoading) return <div className="skeleton h-32 rounded-2xl w-full" />;

  return (
    <div className="rounded-2xl bg-card p-3 shadow-elegant divide-y divide-border/50">
      {ranks.slice(0, 3).map((u, i) => (
        <div key={u.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="w-4 text-xs font-black text-muted-foreground/60">{i + 1}</span>
          <UserAvatar name={u.name} size={32} />
          <span className="flex-1 text-sm font-semibold text-foreground truncate">{u.name}</span>
          <span className="text-sm font-bold text-primary">{formatScore(u.totalScore)}</span>
        </div>
      ))}
    </div>
  );
}


function TipCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="text-2xl">{emoji}</div>
      <p className="mt-2 text-sm font-bold text-foreground leading-tight">{title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground leading-snug">{desc}</p>
    </div>
  );
}

function Section({
  title,
  empty,
  loading,
  items,
  showAuthor,
}: {
  title: string;
  empty: string;
  loading: boolean;
  items: Array<import("@/types").Sighting>;
  showAuthor?: boolean;
}) {
  return (
    <section className="mt-7 px-5">
      <h2 className="mb-3 text-base font-bold text-foreground">{title}</h2>
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-40 w-44 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((s) => (
            <SightingCard
              key={s.id}
              sighting={s}
              byName={showAuthor ? s.userName : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}