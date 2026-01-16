import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { listBookings } from "../api/bookingsQuery";
import type { BookingView } from "../api/bookingsQuery";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import { cancelBooking } from "../api/bookings";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { storage } from "../auth/storage";

type Tab = "mine" | "all";

function asShortId(id?: string | null) {
  if (!id) return "-";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export default function TeacherBookingsPage() {
  const { userId } = useAuth();
  const myEmail = storage.getEmail() ?? "(yo)";

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

  const classroomMap = useMemo(() => {
    const m: Record<string, string> = {};
    classrooms.forEach((c) => (m[c.id] = c.code));
    return m;
  }, [classrooms]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await listClassrooms({ skip: 0, limit: 500 });
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
    // al cambiar tab, reinicia paginación
    setOffset(0);
  }, [tab]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter, classroomId, limit, offset, userId]);

  const onCancel = async (bookingId: string) => {
    const ok = window.confirm("¿Cancelar esta reserva? Esta acción cambia el estado a CANCELLED.");
    if (!ok) return;

    setErr(null);
    try {
      await cancelBooking(bookingId);
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) setErr("No tienes permisos para cancelar esta reserva (solo puedes cancelar tus reservas).");
      else if (status === 404) setErr("La reserva no existe o ya fue cancelada.");
      else setErr(e?.response?.data?.detail ?? "Error cancelando la reserva.");
    }
  };

  const renderUser = (b: BookingView) => {
    const anyB = b as any;
    const userEmail = anyB.user_email as string | undefined;

    if (tab === "mine") return myEmail;
    // Si el query-engine no manda email, mostramos un id corto
    return userEmail ?? asShortId(b.user_id);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Reservas</div>
        <div className="text-sm text-slate-500">
          Docente: puedes cancelar únicamente tus reservas (tab “Mis reservas”).
        </div>
      </div>

      {err && <Alert type="error">{err}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "mine" ? "primary" : "ghost"} onClick={() => setTab("mine")}>
          Mis reservas
        </Button>
        <Button variant={tab === "all" ? "primary" : "ghost"} onClick={() => setTab("all")}>
          Todas
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 font-semibold text-slate-900">Filtros</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="CONFIRMED / CANCELLED"
              value={statusFilter}
              onChange={(e) => {
                setOffset(0);
                setStatusFilter(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Aula</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Limit</label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => {
                setOffset(0);
                setLimit(Number(e.target.value));
              }}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setStatusFilter("");
                setClassroomId("");
                setLimit(50);
                setOffset(0);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Total: {total} | Offset: {offset}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" disabled={!canPrev || loading} onClick={() => setOffset((o) => Math.max(0, o - limit))}>
          Anterior
        </Button>
        <Button variant="secondary" disabled={!canNext || loading} onClick={() => setOffset((o) => o + limit)}>
          Siguiente
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-slate-600">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Aula</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No hay resultados con los filtros actuales.
                </td>
              </tr>
            ) : (
              items.map((b) => {
                const subject = (b as any).subject as string | undefined;
                const classroomLabel = classroomMap[b.classroom_id ?? ""] ?? (b.classroom_id ?? "-");
                const canCancel = tab === "mine" && b.status === "CONFIRMED";

                return (
                  <tr key={b.booking_id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">{renderUser(b)}</td>
                    <td className="px-4 py-3">{classroomLabel}</td>
                    <td className="px-4 py-3">{subject ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded px-2 py-1 text-xs font-medium",
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800",
                        ].join(" ")}
                      >
                        {b.status ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{b.start_time ?? "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.end_time ?? "-"}</td>
                    <td className="px-4 py-3">
                      {canCancel ? (
                        <Button variant="danger" onClick={() => onCancel(b.booking_id)}>
                          Cancelar
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
