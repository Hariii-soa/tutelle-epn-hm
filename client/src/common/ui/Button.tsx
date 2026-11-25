import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  loading?: boolean;
};

const styles = {
  primary: "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-700",
  outline: "border border-neutral-200 bg-white text-brand hover:border-brand/40 hover:bg-brand-50",
  danger: "bg-[#FC3D32] text-white shadow-lg shadow-[#FC3D32]/25 hover:bg-[#e5342a] focus-visible:outline-[#FC3D32]",
  ghost: "text-brand hover:bg-brand-50",
} as const;

export function Button({ variant = "primary", loading, disabled, className = "", children, ...rest }: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
