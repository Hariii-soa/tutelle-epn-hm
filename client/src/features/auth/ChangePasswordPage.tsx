import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Lock } from "lucide-react";
import logo from "../../assets/logo.png";
import { ApiError } from "../../common/api";
import { Alert } from "../../common/ui/Alert";
import { Button } from "../../common/ui/Button";
import { Field } from "../../common/ui/Field";
import { useAuth } from "./AuthContext";
import { homeOf } from "./guards";

export default function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!f.currentPassword) local.currentPassword = "Mot de passe actuel requis";
    if (f.newPassword.length < 8) local.newPassword = "8 caractères minimum";
    if (f.newPassword !== f.confirmation) local.confirmation = "Les mots de passe ne correspondent pas";
    setErrors(local);
    setBanner(null);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      navigate(homeOf(await changePassword(f)), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else setBanner(err instanceof ApiError ? err.message : "Une erreur est survenue");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-grid px-6 py-12">
      <div className="w-full max-w-[480px] rounded-3xl border border-brand/10 bg-white p-8 shadow-xl shadow-brand/5">
        <img src={logo} alt="Ministère de l'Économie et des Finances" className="mx-auto h-24 object-contain" />
        <p className="eyebrow mt-6">Première connexion</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">Choisissez un nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Votre mot de passe provisoire doit être remplacé avant d'accéder à l'application.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {banner && <Alert kind="error">{banner}</Alert>}
          <Field label="Mot de passe actuel" type="password" icon={Lock} value={f.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" autoFocus error={errors.currentPassword} />
          <Field label="Nouveau mot de passe" type="password" icon={KeyRound} value={f.newPassword} onChange={set("newPassword")} autoComplete="new-password" hint="8 caractères minimum" error={errors.newPassword} />
          <Field label="Confirmation" type="password" icon={KeyRound} value={f.confirmation} onChange={set("confirmation")} autoComplete="new-password" error={errors.confirmation} />
          <Button type="submit" loading={busy} className="w-full">
            Enregistrer et continuer
          </Button>
          <button type="button" onClick={() => logout()} className="mx-auto block text-[13px] text-neutral-500 hover:text-brand">
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
