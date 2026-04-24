import { Link, useLocation } from "@tanstack/react-router";
import { Home, Map, Trophy, User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/explorer", label: "Explorer", icon: Map },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomTabs() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 safe-bottom">
      <div className="relative mx-3 mb-3 rounded-3xl border border-border bg-card/95 px-2 py-2 shadow-elegant backdrop-blur-md">
        <div className="grid grid-cols-5 items-center">
          <TabItem {...TABS[0]} active={pathname === TABS[0].to} />
          <TabItem {...TABS[1]} active={pathname === TABS[1].to} />
          <CenterCapture />
          <TabItem {...TABS[2]} active={pathname === TABS[2].to} />
          <TabItem {...TABS[3]} active={pathname === TABS[3].to} />
        </div>
      </div>
    </nav>
  );
}

function TabItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-0.5 py-1.5 text-xs transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
      <span className={cn("text-[10px]", active && "font-semibold")}>{label}</span>
    </Link>
  );
}

function CenterCapture() {
  return (
    <div className="relative flex justify-center">
      <Link
        to="/capture"
        aria-label="Capture wildlife"
        className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-amber text-foreground shadow-fab transition-transform active:scale-95"
      >
        <Camera className="h-7 w-7" strokeWidth={2.5} />
      </Link>
    </div>
  );
}