import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { AtSign, BadgeCheck, KeyRound, Loader2, Lock, RefreshCw, ShieldAlert, User as UserIcon, UserPlus } from "lucide-react";
import { ApiError } from "../../common/api";
import type { User } from "../../common/types";
import { Alert } from "../../common/ui/Alert";
import { Button } from "../../common/ui/Button";
import { Field } from "../../common/ui/Field";
import { ConfirmDialog } from "../../common/ui/ConfirmDialog";
import { Modal } from "../../common/ui/Modal";
import { createUser, listUsers, resetPassword, setStatut, type NewUser } from "./users.api";

const EMPTY: NewUser = { nom: "", prenoms: "", matricule: "", email: "", password: "", confirmation: "" };
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const generate = () =>
  Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => ALPHABET[n % ALPHABET.length]).join("");

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Une erreur est survenue");

const LABELS: Record<keyof NewUser, string> = {
  nom: "Nom",
  prenoms: "Prénoms",
  matricule: "Matricule",
  email: "Adresse e-mail",
  password: "Mot de passe provisoire",
  confirmation: "Confirmation du mot de passe",
};

type Dialog = { kind: "statut" | "reset"; user: User } | null;
type CreateStep = "missing" | "confirm" | null;

export default function UsersTab({ onChange }: { onChange: () => void }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<NewUser>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [step, setStep] = useState<CreateStep>(null);
  const [missing, setMissing] = useState<string[]>([]);

    // setState uniquement dans les callbacks asynchrones
  const load = useCallback(() => {
    listUsers()
      .then((u) => {
        setUsers(u);
        setLoadError(null);
      })
      .catch((e) => setLoadError(errMsg(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const set = (k: keyof NewUser) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBanner(null);
    const empty = (Object.keys(LABELS) as (keyof NewUser)[]).filter((k) => !form[k].trim());
    const local: Record<string, string> = {};
    empty.forEach((k) => (local[k] = "Champ requis"));
    if (!empty.length && form.password !== form.confirmation) local.confirmation = "Les mots de passe ne correspondent pas";
    setErrors(local);

    if (empty.length) {
      setMissing(empty.map((k) => LABELS[k]));
      setStep("missing");
    } else if (!Object.keys(local).length) {
      setStep("confirm");
    }
  }

  async function doCreate() {
    setBusy(true);
    try {
      const u = await createUser(form);
      setStep(null);
      setForm(EMPTY);
      setNotice(`Compte créé pour ${u.prenoms} ${u.nom}. Un changement de mot de passe lui sera demandé à la première connexion.`);
      load();
      onChange();
    } catch (err) {
      setStep(null);
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else setBanner(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3.3fr)]">
      {/* Formulaire */}
      <section className="rounded-3xl border border-brand/10 bg-white p-7 shadow-sm">
        <p className="eyebrow">Nouveau compte</p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight">Ajouter un utilisateur</h2>
        <p className="mt-2 text-sm text-neutral-500">Renseignez les informations qui permettront à l'employé de se connecter.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {banner && <Alert kind="error">{banner}</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom" icon={UserIcon} placeholder="Nom" value={form.nom} onChange={set("nom")} error={errors.nom} />
            <Field label="Prénoms" icon={UserIcon} placeholder="Prénoms" value={form.prenoms} onChange={set("prenoms")} error={errors.prenoms} />
          </div>
          <Field label="Matricule" icon={BadgeCheck} placeholder="Matricule" value={form.matricule} onChange={set("matricule")} hint="3 à 20 caractères alphanumériques" error={errors.matricule} />
          <Field label="Adresse e-mail" type="email" icon={AtSign} placeholder="nom@gmail.com" value={form.email} onChange={set("email")} autoComplete="off" error={errors.email} />
          <Field
            label="Mot de passe provisoire"
            type="password"
            icon={Lock}
            placeholder="8 caractères minimum"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
            error={errors.password}
            action={
              <button
                type="button"
                onClick={() => {
                  const p = generate();
                  setForm({ ...form, password: p, confirmation: p });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <RefreshCw className="size-3" /> Générer
              </button>
            }
          />
          <Field label="Confirmation" type="password" icon={KeyRound} placeholder="Confirmez le mot de passe" value={form.confirmation} onChange={set("confirmation")} autoComplete="new-password" error={errors.confirmation} />
          <Button type="submit" className="w-full">
            <UserPlus className="size-4" /> Créer le compte
          </Button>
        </form>
      </section>

      {/* Répertoire */}
      <section className="rounded-3xl border border-brand/10 bg-white p-7 shadow-sm">
        <p className="eyebrow">Répertoire</p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight">Utilisateurs créés</h2>
        <p className="mt-2 text-sm text-neutral-500" aria-live="polite">
          {users ? `${users.length} compte${users.length > 1 ? "s" : ""} enregistré${users.length > 1 ? "s" : ""}` : "Chargement…"}
        </p>

        {notice && <div className="mt-4"><Alert kind="success">{notice}</Alert></div>}
        {loadError && (
          <div className="mt-4 space-y-2">
            <Alert kind="error">{loadError}</Alert>
            <Button variant="outline" onClick={() => { setLoadError(null); load(); }}>Réessayer</Button>
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-brand-50 text-[11px] uppercase tracking-[0.12em] text-neutral-600">
                <th className="rounded-l-lg px-3 py-3 font-semibold">Utilisateur</th>
                <th className="px-3 py-3 font-semibold">Matricule</th>
                <th className="px-3 py-3 font-semibold">Statut</th>
                <th className="rounded-r-lg px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {!users && !loadError && (
                <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin text-brand" /></td></tr>
              )}
              {users?.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-neutral-500">Aucun utilisateur créé.</td></tr>
              )}
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/50">
                  <td className="px-3 py-3">
                    <div className="font-medium">{u.prenoms} {u.nom}</div>
                    <div className="text-xs text-neutral-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[13px]">{u.matricule}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${u.statut === "ACTIF" ? "bg-brand-100 text-brand-700" : "bg-neutral-100 text-neutral-600"}`}>
                      <span className={`size-1.5 rounded-full ${u.statut === "ACTIF" ? "bg-brand" : "bg-neutral-400"}`} />
                      {u.statut === "ACTIF" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setDialog({ kind: "statut", user: u })}>
                        {u.statut === "ACTIF" ? "Désactiver" : "Activer"}
                      </Button>
                      <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => setDialog({ kind: "reset", user: u })}>
                        Réinitialiser
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {step === "missing" && (
        <ConfirmDialog
          tone="warning"
          icon={ShieldAlert}
          title="Formulaire incomplet"
          confirmLabel="Compris"
          onConfirm={() => setStep(null)}
          onClose={() => setStep(null)}
        >
          <p>Renseignez les champs suivants avant de créer le compte :</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 font-medium text-neutral-800">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </ConfirmDialog>
      )}
      {step === "confirm" && (
        <ConfirmDialog
          title="Créer ce compte ?"
          icon={UserPlus}
          confirmLabel="Créer le compte"
          cancelLabel="Annuler"
          loading={busy}
          onConfirm={doCreate}
          onClose={() => !busy && setStep(null)}
        >
          <p>Vérifiez les informations avant validation :</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-neutral-500">Nom</dt>
            <dd className="font-medium text-neutral-900">{form.prenoms.trim()} {form.nom.trim()}</dd>
            <dt className="text-neutral-500">Matricule</dt>
            <dd className="font-mono text-[13px] font-medium text-neutral-900">{form.matricule.trim()}</dd>
            <dt className="text-neutral-500">E-mail</dt>
            <dd className="break-all font-medium text-neutral-900">{form.email.trim()}</dd>
          </dl>
          <p className="mt-3 text-xs text-neutral-500">L'utilisateur devra changer son mot de passe provisoire à sa première connexion.</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "statut" && (
        <StatutDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onDone={(m) => {
            setDialog(null);
            setNotice(m);
            load();
            onChange();
          }}
        />
      )}
      {dialog?.kind === "reset" && (
        <ResetDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onDone={(m) => {
            setDialog(null);
            setNotice(m);
          }}
        />
      )}
    </div>
  );
}

function StatutDialog({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = user.statut === "ACTIF" ? "INACTIF" : "ACTIF";
  const name = `${user.prenoms} ${user.nom}`;

  return (
    <ConfirmDialog
      tone={next === "INACTIF" ? "danger" : "brand"}
      title={next === "INACTIF" ? "Désactiver ce compte ?" : "Réactiver ce compte ?"}
      confirmLabel={next === "INACTIF" ? "Désactiver" : "Activer"}
      cancelLabel="Annuler"
      loading={busy}
      onClose={() => !busy && onClose()}
      onConfirm={async () => {
        setBusy(true);
        try {
          await setStatut(user.id, next);
          onDone(`Compte ${next === "INACTIF" ? "désactivé" : "réactivé"} : ${name}.`);
        } catch (e) {
          setError(errMsg(e));
          setBusy(false);
        }
      }}
    >
      <p>
        {next === "INACTIF"
          ? `${name} sera déconnecté(e) et ne pourra plus se connecter.`
          : `${name} pourra de nouveau se connecter.`}
      </p>
      {error && <div className="mt-3"><Alert kind="error">{error}</Alert></div>}
    </ConfirmDialog>
  );
}

function ResetDialog({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: (m: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = `${user.prenoms} ${user.nom}`;

  function validate(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!password) local.password = "Champ requis";
    else if (password.length < 8) local.password = "8 caractères minimum";
    if (!confirmation) local.confirmation = "Champ requis";
    else if (password !== confirmation) local.confirmation = "Les mots de passe ne correspondent pas";
    setErrors(local);
    if (!Object.keys(local).length) setConfirming(true);
  }

  async function submit() {
    setBusy(true);
    try {
      await resetPassword(user.id, password, confirmation);
      onDone(`Mot de passe réinitialisé pour ${name}. Il devra le changer à sa prochaine connexion.`);
    } catch (err) {
      setConfirming(false);
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else setBanner(errMsg(err));
      setBusy(false);
    }
  }

  if (confirming)
    return (
      <ConfirmDialog
        tone="warning"
        icon={KeyRound}
        title="Réinitialiser le mot de passe ?"
        confirmLabel="Réinitialiser"
        cancelLabel="Retour"
        loading={busy}
        onClose={() => !busy && setConfirming(false)}
        onConfirm={submit}
      >
        <p>
          Le mot de passe de <strong className="text-neutral-900">{name}</strong> sera remplacé et sa session actuelle fermée.
          Il devra choisir un nouveau mot de passe à sa prochaine connexion.
        </p>
      </ConfirmDialog>
    );

  return (
    <Modal title="Réinitialiser le mot de passe" onClose={onClose}>
      <p className="mb-4 text-sm text-neutral-600">Nouveau mot de passe provisoire pour {name}.</p>
      <form onSubmit={validate} noValidate className="space-y-4">
        {banner && <Alert kind="error">{banner}</Alert>}
        <Field
          label="Mot de passe provisoire"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
          error={errors.password}
          action={
            <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline" onClick={() => { const p = generate(); setPassword(p); setConfirmation(p); }}>
              <RefreshCw className="size-3" /> Générer
            </button>
          }
        />
        <Field label="Confirmation" type="password" icon={KeyRound} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" error={errors.confirmation} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Continuer</Button>
        </div>
      </form>
    </Modal>
  );
}
