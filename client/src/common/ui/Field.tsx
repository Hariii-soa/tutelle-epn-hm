import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  action?: ReactNode;
};

export function Field({ label, icon: Icon, error, hint, action, type = "text", className = "", ...rest }: Props) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPwd = type === "password";
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-neutral-900">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        {Icon && <Icon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />}
        <input
          id={id}
          type={isPwd && shown ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-xl border bg-white text-sm text-neutral-900 shadow-xs transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-brand focus:ring-4 focus:ring-brand/10 focus:outline-none ${
            Icon ? "pl-10" : "pl-3.5"
          } ${isPwd ? "pr-11" : "pr-3.5"} ${error ? "border-red-500" : "border-neutral-200"}`}
          {...rest}
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:text-brand"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
