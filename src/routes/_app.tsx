import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";
import { BottomTabs } from "@/components/wildlife/BottomTabs";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getCurrentUser()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { pathname } = useLocation();
  // Capture screen takes the full viewport — hide bottom tabs there.
  const hideTabs = pathname === "/capture" || pathname === "/result";
  return (
    <div className="relative min-h-dvh bg-muted">
      <Outlet />
      {!hideTabs && <BottomTabs />}
    </div>
  );
}