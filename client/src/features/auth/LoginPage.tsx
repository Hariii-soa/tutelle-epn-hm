import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import logo from "../../assets/logo.png";
import { ApiError } from "../../common/api";
import { Alert } from "../../common/ui/Alert";
import { Button } from "../../common/ui/Button";
import { Field } from "../../common/ui/Field";
import { useAuth } from "./AuthContext";
import { homeOf } from "./guards";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!identifiant.trim()) local.identifiant = "Saisissez votre adresse e-mail ou identifiant";
    if (!password) local.password = "Saisissez votre mot de passe";
    setErrors(local);
    setBanner(null);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const user = await login({ identifiant: identifiant.trim(), password, remember });
      navigate(homeOf(user), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else setBanner(err instanceof ApiError ? err.message : "Une erreur est survenue");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Panneau institutionnel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand via-brand-700 to-brand-900 p-[76px] text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[560px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-[400px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -top-32 right-0 size-[420px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative grid h-[240px] w-[330px] place-items-center rounded-3xl bg-white p-6 shadow-2xl shadow-black/20">
          <img src={logo} alt="Ministère de l'Économie et des Finances — République de Madagascar" className="max-h-full object-contain" />
        </div>

        <div className="relative my-auto pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Portail officiel</p>
          <h1 className="mt-5 text-[64px] font-medium leading-[1.05] tracking-tight">
            Une gestion publique plus simple, plus proche.
          </h1>
          <p className="mt-8 max-w-md text-[17px] leading-8 text-white/75">
            Accédez à votre espace administratif sécurisé et retrouvez les outils essentiels du bureau de tutelle.
          </p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="grid place-items-center bg-grid px-6 py-12">
        <div className="w-full max-w-[550px]">
          <img src={logo} alt="" aria-hidden className="mb-8 h-24 object-contain lg:hidden" />
          <p className="eyebrow">Bureau de tutelle</p>
          <h2 className="mt-4 text-[44px] font-medium leading-tight tracking-tight">Heureux de vous revoir</h2>
          <p className="mt-3 text-[17px] text-neutral-500">Renseignez vos identifiants pour accéder à votre espace.</p>

          <form onSubmit={onSubmit} noValidate className="mt-10 space-y-5">
            {banner && <Alert kind="error">{banner}</Alert>}
            <Field
              label="Adresse e-mail ou identifiant administrateur"
              icon={Mail}
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              placeholder="nom@exemple.mg"
              autoComplete="username"
              autoFocus
              error={errors.identifiant}
            />
            <Field
              label="Mot de passe"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Saisissez votre mot de passe"
              autoComplete="current-password"
              error={errors.password}
            />
            <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-neutral-300 accent-brand"
              />
              Se souvenir de moi
            </label>
            <Button type="submit" loading={busy} className="h-[50px] w-full text-[15px]">
              {busy ? "Connexion…" : "Se connecter"}
              {!busy && <ArrowRight className="size-4" />}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
