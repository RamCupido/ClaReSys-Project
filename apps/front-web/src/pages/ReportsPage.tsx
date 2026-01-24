import { useEffect, useState } from "react";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import { listUsers } from "../api/users";
import type { User } from "../api/users";
import { getClassroomReportPdf, getUserReportPdf } from "../api/reports";

function toBackendDateTime(dtLocal: string) {
  // "2026-01-14T12:30" -> "2026-01-14T12:30:00"
  return dtLocal && dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

function openBlobPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function ReportsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [classroomId, setClassroomId] = useState("");
  const [userId, setUserId] = useState("");

  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cls, us] = await Promise.all([
          listClassrooms({ skip: 0, limit: 200 }),
          listUsers({ skip: 0, limit: 200 }),
        ]);
        setClassrooms(cls);
        setUsers(us);

        if (!classroomId && cls[0]) setClassroomId(cls[0].id);
        if (!userId && us[0]) setUserId(us[0].id);
      } catch (e: any) {
        setErr(e?.response?.data?.detail ?? "No se pudo cargar aulas/usuarios.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const from = fromLocal ? toBackendDateTime(fromLocal) : undefined;
  const to = toLocal ? toBackendDateTime(toLocal) : undefined;

  const onClassroomReport = async () => {
    if (!classroomId) return;
    setErr(null);
    setLoading(true);
    try {
      const pdf = await getClassroomReportPdf(classroomId, from, to);
      openBlobPdf(pdf);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error generando reporte de aula.");
    } finally {
      setLoading(false);
    }
  };

  const onUserReport = async () => {
    if (!userId) return;
    setErr(null);
    setLoading(true);
    try {
      const pdf = await getUserReportPdf(userId, from, to);
      openBlobPdf(pdf);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error generando reporte de usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reportes</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h4>Rango (opcional)</h4>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>From</label>
            <input type="datetime-local" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>To</label>
            <input type="datetime-local" value={toLocal} onChange={(e) => setToLocal(e.target.value)} />
          </div>
          <button onClick={() => { setFromLocal(""); setToLocal(""); }}>Limpiar</button>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Backend recibe (sin Z): {from ?? "-"} → {to ?? "-"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <h4>Reporte por Aula</h4>
          <label style={{ display: "block", marginBottom: 6 }}>Aula</label>
          <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            <option value="" disabled>Selecciona un aula</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.code} (cap={c.capacity})</option>
            ))}
          </select>

          <div style={{ marginTop: 10 }}>
            <button disabled={!classroomId || loading} onClick={onClassroomReport}>
              {loading ? "Generando..." : "Generar PDF"}
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <h4>Reporte por Usuario</h4>
          <label style={{ display: "block", marginBottom: 6 }}>Usuario</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="" disabled>Selecciona un usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
            ))}
          </select>

          <div style={{ marginTop: 10 }}>
            <button disabled={!userId || loading} onClick={onUserReport}>
              {loading ? "Generando..." : "Generar PDF"}
            </button>
          </div>
        </div>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}
    </div>
  );
}
