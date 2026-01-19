export default function Alert({ type = "info", children }: { type?: "info" | "error" | "success"; children: any }) {
  const map = {
    info: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${map[type]}`}>{children}</div>;
}
