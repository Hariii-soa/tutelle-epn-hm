import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ApiError } from "../../common/api";
import { Alert } from "../../common/ui/Alert";
import { Button } from "../../common/ui/Button";
import { getConnexions, type Connexion } from "./audit.api";

const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "medium", timeZone: "Indian/Antananarivo" });
const jour = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Indian/Antananarivo" });


export default function AuditTab({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<Connexion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  
  const load = useCallback(() => {
    getConnexions()
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Une erreur est survenue"))
      .finally(() => setBusy(false));
  }, []);
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <section className="rounded-3xl border border-brand/10 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Journal d'audit</p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight">Connexions du jour</h2>
          <p className="mt-2 text-sm capitalize text-neutral-500">{jour.format(new Date())}</p>
        </div>
        <Button variant="outline" onClick={() => { setBusy(true); load(); }} loading={busy} className="h-10 text-[13px]">
          {!busy && <RefreshCw className="size-4" />} Actualiser
        </Button>
      </div>

      {error && <div className="mt-5"><Alert kind="error">{error}</Alert></div>}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-brand-50 text-[11px] uppercase tracking-[0.12em] text-neutral-600">
              <th className="rounded-l-lg px-3 py-3 font-semibold">Heure</th>
              <th className="px-3 py-3 font-semibold">Utilisateur</th>
              <th className="px-3 py-3 font-semibold">Matricule</th>
              <th className="rounded-r-lg px-3 py-3 font-semibold">Adresse IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {!rows && !error && (
              <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="mx-auto size-5 animate-spin text-brand" /></td></tr>
            )}
            {rows?.length === 0 && (
              <tr><td colSpan={4} className="py-10 text-center text-neutral-500">Aucune connexion aujourd'hui.</td></tr>
            )}
            {rows?.map((r) => (
              <tr key={r.id} className="hover:bg-brand-50/50">
                <td className="px-3 py-3 tabular-nums">{heure.format(new Date(r.at))}</td>
                <td className="px-3 py-3 font-medium">{r.prenoms} {r.nom}</td>
                <td className="px-3 py-3 font-mono text-[13px]">{r.matricule}</td>
                <td className="px-3 py-3 font-mono text-[13px] text-neutral-600">{r.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
