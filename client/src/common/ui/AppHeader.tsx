import { useState } from "react";
import { LogOut } from "lucide-react";
import logo from "../../assets/logo.png";
import { useAuth } from "../../features/auth/AuthContext";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

export function AppHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <header className="flex items-center gap-5 rounded-3xl border border-brand/10 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="grid h-30 w-46.5 shrink-0 place-items-center rounded-2xl border border-brand/10 bg-white p-3">
          <img src={logo} alt="Ministère de l'Économie et des Finances — République de Madagascar" className="max-h-full object-contain" />
        </div>
        <div className="flex-1">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 text-base font-semibold">{title}</h1>
        </div>
        <Button variant="outline" className="h-10 text-[13px]" onClick={() => setConfirm(true)}>
          <LogOut className="size-4" /> Déconnexion
        </Button>
      </header>

      {confirm && (
        <ConfirmDialog
          tone="danger"
          title="Se déconnecter ?"
          confirmLabel="Se déconnecter"
          cancelLabel="Annuler"
          loading={busy}
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            setBusy(true);
            await logout();
          }}
        >
          Votre session sera fermée. Vous devrez vous reconnecter pour accéder à l'application.
        </ConfirmDialog>
      )}
    </>
  );
}
