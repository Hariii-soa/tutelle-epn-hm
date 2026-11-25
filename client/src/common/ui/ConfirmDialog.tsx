import type { ReactNode } from "react";
import { AlertTriangle, HelpCircle, LogOut, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type Tone = "brand" | "danger" | "warning";

const TONES: Record<Tone, { icon: LucideIcon; badge: string; button: "primary" | "danger" }> = {
  brand: { icon: HelpCircle, badge: "bg-brand-50 text-brand", button: "primary" },
  danger: { icon: LogOut, badge: "bg-[#FC3D32]/10 text-[#FC3D32]", button: "danger" },
  warning: { icon: AlertTriangle, badge: "bg-amber-100 text-amber-600", button: "primary" },
};

type Props = {
  title: string;
  tone?: Tone;
  icon?: LucideIcon;
  confirmLabel: string;
  /** Absent : boîte d'alerte à un seul bouton. */
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
};

export function ConfirmDialog({ title, tone = "brand", icon, confirmLabel, cancelLabel, loading, onConfirm, onClose, children }: Props) {
  const t = TONES[tone];
  const Icon = icon ?? t.icon;
  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex gap-4">
        <div className={`grid size-11 shrink-0 place-items-center rounded-full ${t.badge}`}>
          <Icon aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1 text-sm text-neutral-600">{children}</div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        {cancelLabel && (
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
        )}
        <Button variant={t.button} loading={loading} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
