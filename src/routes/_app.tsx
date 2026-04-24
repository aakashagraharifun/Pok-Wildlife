import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";
import { BottomTabs } from "@/components/wildlife/BottomTabs";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { pathname } = useLocation();
  const { ready } = useAuth();
  
  // Capture screen takes the full viewport — hide bottom tabs there.
  const hideTabs = pathname === "/capture" || pathname === "/result";

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-pulse rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary" />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            Pok Wildlife
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-muted">
      <Outlet />
      {!hideTabs && <BottomTabs />}
    </div>
  );
}