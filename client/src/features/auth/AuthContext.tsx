import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_EXPIRED, api } from "../../common/api";
import type { User } from "../../common/types";

type Credentials = { identifiant: string; password: string; remember: boolean };
type PwdChange = { currentPassword: string; newPassword: string; confirmation: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (c: Credentials) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (p: PwdChange) => Promise<User>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED, expired);
    return () => window.removeEventListener(AUTH_EXPIRED, expired);
  }, []);

  const login = useCallback(async (body: Credentials) => {
    const r = await api<{ user: User }>("/auth/login", { method: "POST", body });
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  const changePassword = useCallback(async (body: PwdChange) => {
    const r = await api<{ user: User }>("/auth/change-password", { method: "POST", body });
    setUser(r.user);
    return r.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, changePassword }),
    [user, loading, login, logout, changePassword],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth hors AuthProvider");
  return c;
}
