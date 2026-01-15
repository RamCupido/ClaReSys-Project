import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { listBookings } from "../api/bookingsQuery";
import type { BookingView } from "../api/bookingsQuery";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import { cancelBooking } from "../api/bookings";
import Button from "../ui/Button";

function asShortId(id?: string | null) {
  if (!id) return "-";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

type Tab = "mine" | "all";

export default function TeacherBookingsPage() {
  const { userId } = useAuth();

  const [tab, setTab] = useState<Tab>("mine");
  const [items, setItems] = useState<BookingView[]>([]);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

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
        user_id: tab === "mine" ? (userId ?? undefined) : undefined,
        classroom_id: classroomId || undefined,
        status_filter: statusFilter || undefined,
        limit,
        offset,
      });
      setTotal(res.total);
      setItems(res.items);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    // si cambias tab, reinicia offset
    setOffset(0);
  }, [tab]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter, classroomId, limit, offset, userId]);

  const onCancel = async (bookingId: string) => {
    const ok = window.confirm("¿Estás seguro de cancelar esta reserva?");
    if (!ok) return;

    setErr(null);
    try {
      await cancelBooking(bookingId);
      await load(); // vuelve a cargar la lista
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        setErr("No tienes permisos para cancelar esta reserva.");
      } else if (status === 404) {
        setErr("La reserva no existe o ya fue cancelada.");
      } else {
        setErr(e?.response?.data?.detail ?? "Error cancelando la reserva.");
      }
    }
  };


  return (
    <div>
      <h2>Reservas</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("mine")}
          disabled={tab === "mine"}
        >
          Mis reservas
        </button>
        <button
          onClick={() => setTab("all")}
          disabled={tab === "all"}
        >
          Todas
        </button>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16 }}>
        <h4>Filtros</h4>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Estado</label>
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
            <label style={{ display: "block", marginBottom: 6 }}>Aula</label>
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

          <button
            onClick={() => {
              setStatusFilter("");
              setClassroomId("");
              setLimit(50);
              setOffset(0);
            }}
          >
            Limpiar
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          Tab: {tab === "mine" ? "Mis reservas" : "Todas"} | Total: {total} | Offset: {offset}
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
              <th align="left">status</th>
              <th align="left">start_time</th>
              <th align="left">end_time</th>
              <th align="left">acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (

              <tr key={b.booking_id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.booking_id}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{asShortId(b.classroom_id)}</td>
                <td>{b.status ?? "-"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.start_time ?? "-"}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.end_time ?? "-"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#666" }}>
                  No hay resultados con los filtros actuales.
                </td>
              </tr>
            )}
            {items.map((b) => {
              const canCancel = b.status === "CONFIRMED";

              return (
                <tr key={b.booking_id} className="border-t">
                  <td className="font-mono text-xs">{b.booking_id}</td>
                  <td className="font-mono text-xs">{b.classroom_id}</td>
                  <td>
                    <span
                      className={
                        b.status === "CONFIRMED"
                          ? "rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800"
                          : "rounded bg-slate-200 px-2 py-1 text-xs text-slate-700"
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{b.start_time}</td>
                  <td className="font-mono text-xs">{b.end_time}</td>
                  <td>
                    <Button
                      variant="danger"
                      disabled={!canCancel}
                      onClick={() => onCancel(b.booking_id)}
                    >
                      Cancelar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
