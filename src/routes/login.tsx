import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { Leaf, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUser } from "@/services/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Pok Wildlife" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && getCurrentUser()) {
      throw redirect({ to: "/home" });
    }
  },
  component: LoginScreen,
});

function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ava@example.com");
  const [password, setPassword] = useState("demo");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background safe-top safe-bottom">
      <div className="bg-gradient-hero px-6 pb-12 pt-14 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">Pok Wildlife</span>
        </div>
        <h1 className="mt-8 text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Sign in to continue your wildlife journey.
        </p>
      </div>

      <form onSubmit={onSubmit} className="-mt-6 flex-1 rounded-t-3xl bg-background p-6">
        <Field
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Password"
          icon={<Lock className="h-4 w-4" />}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-opacity disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>

        <div className="mt-8 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
          <p className="font-semibold">Demo accounts</p>
          <p className="mt-1 opacity-80">
            ava@example.com · marco@example.com · sara@example.com — password: <code className="font-mono">demo</code>
          </p>
        </div>
      </form>
    </div>
  );
}

export function Field({
  label,
  icon,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <span className="text-muted-foreground">{icon}</span>
        <input
          className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
      </div>
    </label>
  );
}