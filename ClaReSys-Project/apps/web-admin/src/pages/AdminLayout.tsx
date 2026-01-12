import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLayout() {
  const { logout, role, userId } = useAuth();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: 16 }}>
        <h3>ClaReSys Admin</h3>
        <div style={{ fontSize: 12, marginBottom: 12 }}>
          <div>role: {role}</div>
          <div>user: {userId}</div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link to="/admin/classrooms">Aulas</Link>
          <Link to="/admin/bookings/create">Crear reserva</Link>
          <Link to="/admin/bookings">Listar reservas</Link>
          <Link to="/admin/users">Usuarios</Link>
        </nav>

        <button onClick={logout} style={{ marginTop: 16 }}>
          Cerrar sesión
        </button>
      </aside>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
