import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { storage } from "../auth/storage"

function Item({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }: { isActive: boolean }) =>
        [
          "block rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-brand-blue text-white shadow-sm ring-1 ring-brand-gold/60"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function TeacherLayout() {
  const { logout, role, userId } = useAuth();
  const email = storage.getEmail();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue2 to-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 p-4">
        <aside className="col-span-12 md:col-span-3">
          <div className="rounded-3xl bg-white/95 p-4 shadow-2xl ring-1 ring-white/10">
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-blue2 p-4 text-white">
              <div className="text-lg font-semibold">ClaReSys</div>
              <div className="text-xs text-white/75">Docente Portal</div>
              <div className="mt-2 h-1 w-16 rounded-full bg-brand-gold" />
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Sesión</div>
              <div className="text-sm font-semibold text-brand-ink">{role}</div>
              <div className="mt-1 break-all text-xs text-slate-500">{email ?? userId}</div>
            </div>

            <div className="space-y-1">
              <div className="px-1 pt-2 text-xs font-semibold text-slate-500">Reservas</div>
              <Item to="/teacher/bookings" label="Reservas" />
              <Item to="/teacher/bookings/create" label="Crear Reserva" />

              <div className="px-1 pt-3 text-xs font-semibold text-slate-500">Soporte</div>
              <Item to="/teacher/maintenance" label="Mantenimiento" />
            </div>

            <div className="mt-4">
              <button
                onClick={logout}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 ring-1 ring-brand-gold/40"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="rounded-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-white/10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
