import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Alert({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const err = kind === "error";
  const Icon = err ? AlertCircle : CheckCircle2;
  return (
    <div
      role={err ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
        err ? "border-red-200 bg-red-50 text-red-800" : "border-brand/20 bg-brand-50 text-brand-900"
      }`}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
