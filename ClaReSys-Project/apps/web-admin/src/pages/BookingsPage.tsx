import { useEffect, useMemo, useState } from "react";
import { listBookings } from "../api/bookingsQuery";
import type { BookingView } from "../api/bookingsQuery";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import { listUsers } from "../api/users";
import type { User } from "../api/users";

function asShortId(id?: string | null) {
  if (!id) return "-";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export default function BookingsPage() {
  const [items, setItems] = useState<BookingView[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [classroomId, setClassroomId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // paginación
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);

  // aulas para selector
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const selectedRoom = useMemo(
    () => classrooms.find((c) => c.id === classroomId) ?? null,
    [classroomId, classrooms]
  );

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await listClassrooms({ skip: 0, limit: 200 });
      setClassrooms(data);
    } finally {
      setLoadingRooms(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listBookings({
        status_filter: statusFilter || undefined,
        classroom_id: classroomId || undefined,
        user_id: userId || undefined,
        limit,
        offset,
      });
      setTotal(res.total);
      setItems(res.items);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setErr("Endpoint de reservas no encontrado. Verifica que query-engine esté levantado y enrute /api/v1/queries/.");
      } else {
        setErr(e?.response?.data?.detail ?? "Error cargando reservas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [cls, us] = await Promise.all([
          listClassrooms({ skip: 0, limit: 500 }),
          listUsers({ skip: 0, limit: 500 }),
        ]);
        setClassrooms(cls);
        setUsers(us);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, classroomId, userId, limit, offset]);

  const onClear = () => {
    setStatusFilter("");
    setClassroomId("");
    setUserId("");
    setLimit(50);
    setOffset(0);
  };

  const classroomMap = useMemo(() => {
    const m: Record<string, string> = {};
    classrooms.forEach((c) => (m[c.id] = c.code));
    return m;
  }, [classrooms]);

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach((u) => (m[u.id] = u.email));
    return m;
  }, [users]);


  return (
    <div>
      <h2>Reservas</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h4>Filtros</h4>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Estado (status_filter)</label>
            <input
              placeholder="CONFIRMED / CANCELLED / ..."
              value={statusFilter}
              onChange={(e) => {
                setOffset(0);
                setStatusFilter(e.target.value);
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Aula (classroom_id)</label>
            <select
              value={classroomId}
              onChange={(e) => {
                setOffset(0);
                setClassroomId(e.target.value);
              }}
              disabled={loadingRooms}
            >
              <option value="">(todas)</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} (cap={c.capacity})
                </option>
              ))}
            </select>
            {selectedRoom && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                {selectedRoom.code} | ID: <span style={{ fontFamily: "monospace" }}>{selectedRoom.id}</span>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Usuario (user_id)</label>
            <input
              placeholder="UUID"
              value={userId}
              onChange={(e) => {
                setOffset(0);
                setUserId(e.target.value);
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Limit</label>
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => {
                setOffset(0);
                setLimit(Number(e.target.value));
              }}
              style={{ width: 100 }}
            />
          </div>

          <button onClick={onClear}>Limpiar</button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          Total: {total} | Offset: {offset}
        </div>

        {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <button disabled={!canPrev || loading} onClick={() => setOffset((o) => Math.max(0, o - limit))}>
          Anterior
        </button>
        <button disabled={!canNext || loading} onClick={() => setOffset((o) => o + limit)}>
          Siguiente
        </button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">booking_id</th>
              <th align="left">classroom_id</th>
              <th align="left">user_id</th>
              <th align="left">status</th>
              <th align="left">start_time</th>
              <th align="left">end_time</th>
              <th align="left">subject</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.booking_id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.booking_id}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{classroomMap[b.classroom_id ?? ""] ?? (b.classroom_id ? b.classroom_id : "-")}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{userMap[b.user_id ?? ""] ?? (b.user_id ? b.user_id : "-")}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.status ?? "-"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.start_time ?? "-"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.end_time ?? "-"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.subject ?? "-"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16, color: "#666" }}>
                  No hay resultados con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
