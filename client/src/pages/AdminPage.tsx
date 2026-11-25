import { useEffect, useState } from "react";
import { AppHeader } from "../common/ui/AppHeader";
import { getStats, type AdminStats } from "../features/audit/audit.api";
import AuditTab from "../features/audit/AuditTab";
import UsersTab from "../features/users/UsersTab";

const TABS = [
  { key: "users", label: "Gestion des utilisateurs" },
  { key: "audit", label: "Journal d'audit" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    getStats().then(setStats).catch(() => setStats(null));
  }, [rev]);

  const tiles = [
    { label: "Utilisateurs", value: stats?.utilisateurs },
    { label: "Comptes actifs", value: stats?.comptesActifs },
    { label: "Connexions aujourd'hui", value: stats?.connexionsAujourdhui },
  ];

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-5">
        <AppHeader eyebrow="Administration" title="Gestion du bureau de tutelle" />

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-700 to-brand-900 p-11 text-white shadow-xl shadow-brand/20">
          <div className="pointer-events-none absolute -right-24 -top-24 size-[360px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-[640px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Espace administrateur</p>
              <h2 className="mt-4 text-[52px] font-medium leading-[1.05] tracking-tight">Pilotez les accès en toute simplicité.</h2>
              <p className="mt-5 text-[15px] text-white/75">
                Créez les comptes, contrôlez leur statut et consultez les connexions du jour.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {tiles.map((t) => (
                <div key={t.label} className="min-w-[150px] rounded-2xl border border-white/15 bg-white/10 px-4 py-5 backdrop-blur">
                  <dd className="text-3xl font-semibold tabular-nums">{t.value ?? "–"}</dd>
                  <dt className="mt-2 text-xs text-white/75">{t.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div role="tablist" aria-label="Sections d'administration" className="grid grid-cols-2 gap-1 rounded-2xl border border-brand/10 bg-white p-1.5 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`h-11 rounded-xl text-sm font-semibold transition ${
                tab === t.key ? "bg-brand text-white shadow-md shadow-brand/20" : "text-neutral-700 hover:bg-brand-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "users" ? <UsersTab onChange={() => setRev((r) => r + 1)} /> : <AuditTab refreshKey={rev} />}
        </div>
      </div>
    </div>
  );
}
