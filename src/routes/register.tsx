import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { Leaf, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUser } from "@/services/auth";
import { Field } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Pok Wildlife" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && getCurrentUser()) {
      throw redirect({ to: "/home" });
    }
  },
  component: RegisterScreen,
});

function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    setBusy(true);
    try {
      await register(name, email, password);
      toast.success("Welcome to Pok Wildlife!");
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
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
        <h1 className="mt-8 text-3xl font-extrabold">Join the hunt</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Discover. Identify. Earn.
        </p>
      </div>

      <form onSubmit={onSubmit} className="-mt-6 flex-1 rounded-t-3xl bg-background p-6">
        <Field label="Name" icon={<UserIcon className="h-4 w-4" />} type="text" value={name} onChange={setName} autoComplete="name" />
        <Field label="Email" icon={<Mail className="h-4 w-4" />} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" icon={<Lock className="h-4 w-4" />} type="password" value={password} onChange={setPassword} autoComplete="new-password" />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-opacity disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}