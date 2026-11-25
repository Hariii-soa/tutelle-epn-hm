import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { Role, User } from "../../common/types";
import { useAuth } from "./AuthContext";

export const homeOf = (u: User) =>
  u.mustChangePwd ? "/changer-mot-de-passe" : u.role === "ADMIN" ? "/admin" : "/accueil";

const Splash = () => (
  <div className="grid min-h-screen place-items-center bg-grid" role="status" aria-label="Chargement">
    <Loader2 className="size-8 animate-spin text-brand" />
  </div>
);

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to={homeOf(user)} replace /> : <Outlet />;
}

export function RequirePwdChange() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!user.mustChangePwd) return <Navigate to={homeOf(user)} replace />;
  return <Outlet />;
}

export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.mustChangePwd) return <Navigate to="/changer-mot-de-passe" replace />;
  if (user.role !== role) return <Navigate to={homeOf(user)} replace />;
  return <Outlet />;
}
