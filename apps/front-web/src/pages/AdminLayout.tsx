import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../ui/Button";

function NavItem({ to, label, exact = false }: { to: string; label: string; exact?: boolean }) {
  const loc = useLocation();
  const active = exact ? loc.pathname === to : loc.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={[
        "block rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout() {
  const { logout, role, userId } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 p-4">
        <aside className="col-span-12 md:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="text-lg font-semibold text-slate-900">ClaReSys</div>
              <div className="text-xs text-slate-500">Admin Portal</div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Sesión</div>
              <div className="text-sm font-medium text-slate-800">{role}</div>
              <div className="mt-1 break-all text-xs text-slate-500">{userId}</div>
            </div>

            <nav className="space-y-1">
              <NavItem to="/admin/classrooms" label="Aulas" exact/>
              <NavItem to="/admin/users" label="Usuarios" exact/>
              <NavItem to="/admin/bookings" label="Reservas" exact/>
              <NavItem to="/admin/bookings/create" label="Crear Reserva" exact/>
              <NavItem to="/admin/reports" label="Reportes" exact/>
            </nav>

            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={logout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
