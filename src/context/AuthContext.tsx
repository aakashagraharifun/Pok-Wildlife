import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import {
  getCurrentUser,
  login as svcLogin,
  logout as svcLogout,
  register as svcRegister,
} from "@/services/auth";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ user: User; session: any }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        refresh();
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await svcLogin(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await svcRegister(name, email, password);
    if (result.session) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await svcLogout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, register, logout, refresh }),
    [user, ready, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}