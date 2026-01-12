import { useEffect, useState } from "react";
import { createUser, deleteUser, listUsers, updateUser } from "../api/users";
import type { User } from "../api/users";

const roles: User["role"][] = ["ADMIN", "TEACHER", "STUDENT"];

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Create form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("TEACHER");

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listUsers({ skip: 0, limit: 100 });
      setItems(data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    setErr(null);
    try {
      await createUser({ email, password, role });
      setEmail("");
      setPassword("");
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) setErr("Email ya registrado.");
      else setErr(e?.response?.data?.detail ?? "Error creando usuario.");
    }
  };

  const onChangeRole = async (u: User, nextRole: User["role"]) => {
    setErr(null);
    try {
      await updateUser(u.id, { role: nextRole });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error actualizando rol.");
    }
  };

  const onToggleActive = async (u: User) => {
    setErr(null);
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error actualizando estado.");
    }
  };

  const onResetPassword = async (u: User) => {
    const newPass = window.prompt(`Nueva contraseña para ${u.email}:`);
    if (!newPass) return;

    setErr(null);
    try {
      await updateUser(u.id, { password: newPass });
      await load();
      alert("Contraseña actualizada.");
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error actualizando contraseña.");
    }
  };

  const onDelete = async (u: User) => {
    const ok = window.confirm(`¿Eliminar usuario ${u.email}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setErr(null);
    try {
      await deleteUser(u.id);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error eliminando usuario.");
    }
  };

  return (
    <div>
      <h2>Usuarios</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h4>Crear usuario</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as User["role"])}>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <button onClick={onCreate} disabled={!email || !password}>
            Crear
          </button>
        </div>

        {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Email</th>
              <th align="left">Role</th>
              <th align="left">Activo</th>
              <th align="left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => onChangeRole(u, e.target.value as User["role"])}>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => onToggleActive(u)}>
                    {u.is_active ? "Sí" : "No"}
                  </button>
                </td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => onResetPassword(u)}>Reset password</button>
                  <button onClick={() => onDelete(u)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
