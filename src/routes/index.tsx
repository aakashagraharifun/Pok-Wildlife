import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      navigate({ to: user ? "/home" : "/login", replace: true });
    }, 900);
    return () => clearTimeout(t);
  }, [ready, user, navigate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-hero text-primary-foreground safe-top safe-bottom">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur animate-pop-in">
        <Leaf className="h-14 w-14 animate-leaf" />
      </div>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">Pok Wildlife</h1>
      <p className="mt-2 text-base text-primary-foreground/80">
        Discover. Identify. Earn.
      </p>
      <div className="mt-12 flex gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground/70" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground/70 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground/70 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
