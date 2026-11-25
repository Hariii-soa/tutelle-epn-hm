import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { GuestOnly, RequirePwdChange, RequireRole, homeOf } from "../features/auth/guards";
import LoginPage from "../features/auth/LoginPage";
import ChangePasswordPage from "../features/auth/ChangePasswordPage";
import AdminPage from "../pages/AdminPage";
import AccueilPage from "../pages/AccueilPage";

function Root() {
  const { user } = useAuth();
  return <Navigate to={user ? homeOf(user) : "/connexion"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route element={<GuestOnly />}>
        <Route path="/connexion" element={<LoginPage />} />
      </Route>
      <Route element={<RequirePwdChange />}>
        <Route path="/changer-mot-de-passe" element={<ChangePasswordPage />} />
      </Route>
      <Route element={<RequireRole role="ADMIN" />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route element={<RequireRole role="AGENT" />}>
        <Route path="/accueil" element={<AccueilPage />} />
      </Route>
      <Route path="*" element={<Root />} />
    </Routes>
  );
}
