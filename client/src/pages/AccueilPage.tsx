import { AppHeader } from "../common/ui/AppHeader";
import { useAuth } from "../features/auth/AuthContext";

// Placeholder : l'espace chargé de tutelle (accueil, tableau de bord, EPN) vient à l'étape suivante.
export default function AccueilPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-5">
        <AppHeader eyebrow="Bureau de tutelle" title="Espace chargé de tutelle" />
        <section className="rounded-3xl border border-brand/10 bg-white p-8 shadow-sm">
          <p className="eyebrow">Accueil</p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight">
            Bonjour {user?.prenoms} {user?.nom}
          </h2>
        </section>
      </div>
    </div>
  );
}
