import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  const styles = {
    default: "bg-emerald-50 text-emerald-600",
    warning: "bg-orange-50 text-orange-600",
    danger: "bg-rose-50 text-rose-600",
  };

  return <span className={cn(base, styles[variant], className)} {...props} />;
}
