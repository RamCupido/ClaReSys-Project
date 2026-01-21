import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Roles } from "../auth/roles";
import { storage } from "../auth/storage";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await login({ email, password });

      storage.setEmail(email);

      const role = storage.getRole();
      if (role === Roles.ADMIN) {
        nav("/admin", { replace: true });
        return;
      }
      if (role === Roles.DOCENTE) {
        nav("/teacher", { replace: true });
        return;
      }

      storage.clearAll();
      setErr("Acceso denegado: rol no permitido.");
    } catch (error: any) {
      setErr(error?.response?.data?.detail ?? "Login falló.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue2 to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
          {/* Left / Brand */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-blue2" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#ffffff,transparent_45%),radial-gradient(circle_at_70%_60%,#D4AF37,transparent_45%)]" />

            <div className="relative flex h-full flex-col justify-between p-8 text-white">
              <div>
                <div className="inline-flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                  <div>
                    <div className="text-xl font-semibold">ClaReSys</div>
                    <div className="text-sm text-white/70">Classroom Reservation System</div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-3xl font-semibold leading-tight">
                    Portal Institucional
                    <span className="block text-brand-gold">Admin y Docente</span>
                  </div>
                  <div className="mt-3 text-sm text-white/75">
                    Accede con tus credenciales para gestionar aulas, reservas y mantenimiento.
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/60">
                Universidad · ClaReSys · {new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Right / Form */}
          <div className="p-7 md:p-10">
            <div className="mb-6">
              <div className="text-sm font-semibold text-brand-blue">Bienvenido</div>
              <div className="text-2xl font-semibold text-brand-ink">Iniciar sesión</div>
              <div className="mt-1 text-sm text-slate-500">
                Ingresa tu correo y contraseña.
              </div>
            </div>

            {err && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue2 focus:ring-2 focus:ring-brand-blue2/30"
                  placeholder="correo@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue2 focus:ring-2 focus:ring-brand-blue2/30"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={[
                  "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  "bg-brand-blue text-white hover:bg-brand-blue2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "ring-1 ring-brand-gold/60 shadow-[0_10px_30px_rgba(11,59,140,0.25)]",
                ].join(" ")}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="text-brand-gold2">ClaReSys</span>
              </div>
            </form>

            {/* Mobile brand header */}
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-blue2 p-4 text-white md:hidden">
              <div className="text-lg font-semibold">ClaReSys</div>
              <div className="text-xs text-white/75">Admin y Docente</div>
              <div className="mt-2 text-xs text-brand-gold">Acceso institucional</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
