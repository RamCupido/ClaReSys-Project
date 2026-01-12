import { useEffect, useMemo, useState } from "react";
import { createBooking } from "../api/bookings";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import { useAuth } from "../auth/AuthContext";

function toBackendDateTime(dtLocal: string) {
  // "2025-10-20T12:30" -> "2025-10-20T12:30:00"
  return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

function isValidRange(startLocal: string, endLocal: string) {
  const s = new Date(startLocal);
  const e = new Date(endLocal);
  return !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s;
}

export default function CreateBookingPage() {
  const { userId } = useAuth();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [classroomId, setClassroomId] = useState("");
  const [startLocal, setStartLocal] = useState("2025-10-20T12:30");
  const [endLocal, setEndLocal] = useState("2025-10-20T13:00");

  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = useMemo(
    () => classrooms.find((c) => c.id === classroomId) ?? null,
    [classroomId, classrooms]
  );

  const canSubmit =
    !!userId &&
    !!classroomId &&
    !!startLocal &&
    !!endLocal &&
    isValidRange(startLocal, endLocal) &&
    !submitting;

  const loadRooms = async () => {
    setLoadingRooms(true);
    setErr(null);
    try {
      const data = await listClassrooms();
      setClassrooms(data);

      // Preselección: primera aula operativa si existe
      const firstOperational = data.find((c) => c.is_operational);
      if (!classroomId && firstOperational) setClassroomId(firstOperational.id);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando aulas.");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setResult(null);

    if (!userId) {
      setErr("No existe userId en sesión.");
      return;
    }
    if (!isValidRange(startLocal, endLocal)) {
      setErr("Rango horario inválido: end_time debe ser mayor a start_time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBooking({
        user_id: userId,
        classroom_id: classroomId,
        start_time: toBackendDateTime(startLocal),
        end_time: toBackendDateTime(endLocal),
      });

      setResult(`OK: ${res.message} (status=${res.status}, id=${res.id})`);
    } catch (e: any) {
      // Si tu backend retorna 409 por conflicto, aquí lo verás claro
      setErr(e?.response?.data?.detail ?? e?.response?.data?.message ?? "Error creando reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Crear Reserva</h2>

      {loadingRooms ? (
        <div>Cargando aulas...</div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Aula</label>
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
              <option value="" disabled>
                Selecciona un aula
              </option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} | cap={c.capacity} | operativa={String(c.is_operational)}
                </option>
              ))}
            </select>

            {selectedRoom && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                ID: <span style={{ fontFamily: "monospace" }}>{selectedRoom.id}</span>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Inicio</label>
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Fin</label>
            <input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
            />
          </div>

          {!isValidRange(startLocal, endLocal) && (
            <div style={{ color: "crimson" }}>
              Rango inválido: el fin debe ser posterior al inicio.
            </div>
          )}

          <button type="submit" disabled={!canSubmit}>
            {submitting ? "Creando..." : "Crear Reserva"}
          </button>

          {result && <div style={{ color: "green" }}>{result}</div>}
          {err && <div style={{ color: "crimson" }}>{err}</div>}

          <div style={{ fontSize: 12, color: "#666" }}>
            Se enviará al backend (sin Z):{" "}
            <code>{toBackendDateTime(startLocal)}</code> →{" "}
            <code>{toBackendDateTime(endLocal)}</code>
          </div>
        </form>
      )}
    </div>
  );
}
