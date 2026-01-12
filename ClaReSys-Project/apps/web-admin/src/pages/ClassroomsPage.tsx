import { useEffect, useState } from "react";
import type { Classroom } from "../api/classrooms";
import { createClassroom, listClassrooms } from "../api/classrooms";

export default function ClassroomsPage() {
  const [items, setItems] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [isOperational, setIsOperational] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listClassrooms();
      setItems(data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando aulas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    setErr(null);
    try {
      await createClassroom({ code, capacity, is_operational: isOperational });
      setCode("");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error creando aula");
    }
  };

  return (
    <div>
      <h2>Aulas</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h4>Crear Aula</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input placeholder="code (ej: LAB-3)" value={code} onChange={(e) => setCode(e.target.value)} />
          <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={isOperational} onChange={(e) => setIsOperational(e.target.checked)} />
            Operativa
          </label>
          <button onClick={onCreate} disabled={!code}>Crear</button>
        </div>
        {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Code</th>
              <th align="left">Capacidad</th>
              <th align="left">Operativa</th>
              <th align="left">ID</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{c.code}</td>
                <td>{c.capacity}</td>
                <td>{String(c.is_operational)}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
