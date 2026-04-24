import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  LogOut, Mail, Calendar, Award, Edit3, Check, X, 
  MapPin, Info, Cake, User as UserIcon, ChevronRight, Settings
} from "lucide-react";
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
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    birthday: user?.birthday || "",
    address: user?.address || "",
  });
  const [busy, setBusy] = useState(false);

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

  const handleUpdate = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh pb-32 bg-muted/30 safe-top">
      {/* Header */}
      <div className="bg-gradient-hero px-5 pb-8 pt-8 text-primary-foreground relative">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <UserAvatar name={user.name} url={user.avatarUrl} size={96} />
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-white">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">{user.name}</h1>
          <p className="mt-1 text-sm font-medium opacity-80 max-w-xs">
            {user.bio || "No bio yet. Tell the world about your wildlife journey!"}
          </p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat
            icon={<Award className="h-4 w-4 text-amber-500" />}
            label="Total score"
            value={formatScore(user.totalScore)}
          />
          <Stat
            icon={<Settings className="h-4 w-4 text-primary" />}
            label="Sightings"
            value={String(sightings.length)}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setForm({
              name: user.name,
              bio: user.bio || "",
              birthday: user.birthday || "",
              address: user.address || "",
            });
            setIsEditing(true);
          }}
          className="flex w-full items-center justify-between rounded-2xl bg-card p-4 shadow-elegant border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Account Settings</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Personal Info & Address</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Achievements */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Recent Achievements</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Achievement badge="🦋" label="Butterfly Hunter" date="2 days ago" />
            <Achievement badge="🌲" label="Park Ranger" date="Yesterday" />
            <Achievement badge="🌟" label="First Capture" date="3 days ago" />
          </div>
        </section>

        {/* Collection */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Collection</h2>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton aspect-square rounded-2xl" />
              ))}
            </div>
          ) : sightings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground shadow-inner">
              No sightings yet. Head outside to start your collection!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sightings.map((s) => (
                <div
                  key={s.id}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-card shadow-sm transition-transform active:scale-95"
                >
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.speciesName} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">
                      {s.emoji}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="truncate text-[9px] font-bold text-white uppercase tracking-tighter">
                      {s.speciesName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 py-4 text-sm font-bold text-destructive transition-colors active:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Edit Sheet (Overlay) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <EditField 
                label="Full Name" 
                icon={<UserIcon className="h-4 w-4" />} 
                value={form.name} 
                onChange={(v) => setForm({...form, name: v})} 
              />
              <EditField 
                label="Bio" 
                icon={<Info className="h-4 w-4" />} 
                value={form.bio} 
                onChange={(v) => setForm({...form, bio: v})} 
                multiline
              />
              <EditField 
                label="Birthday" 
                icon={<Cake className="h-4 w-4" />} 
                value={form.birthday} 
                onChange={(v) => setForm({...form, birthday: v})} 
                type="date"
              />
              <EditField 
                label="Address" 
                icon={<MapPin className="h-4 w-4" />} 
                value={form.address} 
                onChange={(v) => setForm({...form, address: v})} 
              />
            </div>

            <button
              disabled={busy || !form.name.trim()}
              onClick={handleUpdate}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {busy ? "Saving Changes..." : (
                <>
                  <Check className="h-5 w-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({ 
  label, icon, value, onChange, type = "text", multiline = false 
}: { 
  label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean 
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
      <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all">
        <div className="mt-0.5 text-primary">{icon}</div>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold outline-none resize-none h-20"
            placeholder={`Enter your ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold outline-none"
            placeholder={`Enter your ${label.toLowerCase()}...`}
          />
        )}
      </div>
    </div>
  );
}

function Achievement({ badge, label, date }: { badge: string; label: string; date: string }) {
  return (
    <div className="flex w-32 shrink-0 flex-col items-center rounded-2xl bg-card p-4 shadow-card text-center border border-border/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl shadow-inner">
        {badge}
      </div>
      <p className="mt-3 text-[11px] font-black text-foreground leading-tight uppercase tracking-tighter">{label}</p>
      <p className="mt-1 text-[9px] font-medium text-muted-foreground">{date}</p>
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
    <div className="rounded-2xl bg-card p-4 shadow-elegant border border-border transition-transform active:scale-95">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-black text-foreground tabular-nums tracking-tighter">{value}</p>
    </div>
  );
}