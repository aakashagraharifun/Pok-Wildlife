import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Mail, Calendar, Award } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { listUserSightings } from "@/services/sightings";
import { UserAvatar } from "@/components/wildlife/UserAvatar";
import { formatMemberSince, formatScore } from "@/utils/formatters";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Pok Wildlife" }] }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: sightings = [], isLoading } = useQuery({
    queryKey: ["sightings", "user", user?.id],
    queryFn: () => listUserSightings(user!.id),
    enabled: !!user,
  });

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-dvh pb-32 safe-top">
      <div className="bg-gradient-hero px-5 pb-12 pt-8 text-primary-foreground">
        <div className="flex flex-col items-center text-center">
          <UserAvatar name={user.name} size={92} />
          <h1 className="mt-3 text-2xl font-extrabold">{user.name}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm opacity-80">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs opacity-70">
            <Calendar className="h-3 w-3" />
            Member since {formatMemberSince(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="-mt-6 px-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            icon={<Award className="h-4 w-4" />}
            label="Total score"
            value={formatScore(user.totalScore)}
          />
          <Stat
            icon={<Award className="h-4 w-4" />}
            label="Sightings"
            value={String(sightings.length)}
          />
        </div>
      </div>

      <section className="mt-6 px-4">
        <h2 className="mb-3 text-base font-bold text-foreground">Your collection</h2>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton aspect-square rounded-xl" />
            ))}
          </div>
        ) : sightings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No sightings yet. Tap the camera button to capture your first!
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {sightings.map((s) => (
              <div
                key={s.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/15 shadow-card"
              >
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.speciesName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    {s.emoji}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-1.5">
                  <p className="truncate text-[10px] font-semibold text-primary-foreground">
                    {s.speciesName}
                  </p>
                  <p className="text-[10px] font-bold text-accent">+{s.score}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 px-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-base font-semibold text-foreground transition-colors active:bg-secondary"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-extrabold text-foreground tabular-nums">{value}</p>
    </div>
  );
}