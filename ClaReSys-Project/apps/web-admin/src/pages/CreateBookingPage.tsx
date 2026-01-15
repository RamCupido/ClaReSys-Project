import { useEffect, useMemo, useState } from "react";
import { createBooking } from "../api/bookings";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import { useAuth } from "../auth/AuthContext";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { Card, CardBody, CardHeader } from "../ui/Card";

const MIN_HOUR = 7;   // 07:00
const MAX_HOUR = 20;  // 20:00

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isWeekday(dateStr: string) {
  // dateStr: YYYY-MM-DD
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return day >= 1 && day <= 5;
}

function toIsoNoZ(dateStr: string, hour: number, minute: number) {
  // "YYYY-MM-DDTHH:mm:00" (sin Z)
  return `${dateStr}T${pad2(hour)}:${pad2(minute)}:00`;
}

function isWithinBusinessHours(hour: number, minute: number) {
  // Permite exactamente 07:00 hasta 20:00
  if (hour < MIN_HOUR || hour > MAX_HOUR) return false;
  if (hour === MIN_HOUR && minute < 0) return false;
  if (hour === MAX_HOUR && minute > 0) return false; // 20:00 exacto, no 20:xx
  return minute >= 0 && minute <= 59;
}

function compareDateTime(dateStr: string, h1: number, m1: number, h2: number, m2: number) {
  const a = new Date(`${dateStr}T${pad2(h1)}:${pad2(m1)}:00`);
  const b = new Date(`${dateStr}T${pad2(h2)}:${pad2(m2)}:00`);
  return a.getTime() - b.getTime();
}

export default function CreateBookingPage() {
  const { userId } = useAuth();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [classroomId, setClassroomId] = useState("");

  // Fecha + hora numérica
  const [dateStr, setDateStr] = useState(() => {
    // default: hoy (puede ser fin de semana; validación lo controla)
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  });

  const [startHour, setStartHour] = useState<number>(7);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(8);
  const [endMinute, setEndMinute] = useState<number>(0);

  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = useMemo(
    () => classrooms.find((c) => c.id === classroomId) ?? null,
    [classroomId, classrooms]
  );

  const startOk = isWithinBusinessHours(startHour, startMinute);
  const endOk = isWithinBusinessHours(endHour, endMinute);
  const weekdayOk = isWeekday(dateStr);
  const rangeOk = weekdayOk && startOk && endOk && compareDateTime(dateStr, startHour, startMinute, endHour, endMinute) < 0;

  const startIso = toIsoNoZ(dateStr, startHour, startMinute);
  const endIso = toIsoNoZ(dateStr, endHour, endMinute);

  const canSubmit =
    !!userId &&
    !!classroomId &&
    rangeOk &&
    !submitting;

  const loadRooms = async () => {
    setLoadingRooms(true);
    setErr(null);
    try {
      const data = await listClassrooms({ skip: 0, limit: 200 });
      setClassrooms(data);

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
    if (!weekdayOk) {
      setErr("Solo se permiten reservas de lunes a viernes.");
      return;
    }
    if (!startOk || !endOk) {
      setErr("Solo se permiten reservas entre 07:00 y 20:00 (20:00 exacto).");
      return;
    }
    if (!rangeOk) {
      setErr("Rango inválido: la hora fin debe ser posterior a la hora inicio.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBooking({
        user_id: userId,
        classroom_id: classroomId,
        start_time: startIso,
        end_time: endIso,
      });

      setResult(`OK: ${res.message} (status=${res.status}, id=${res.id})`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        setErr("Conflicto: el aula ya tiene una reserva en ese rango.");
      } else {
        setErr(e?.response?.data?.detail ?? e?.response?.data?.message ?? "Error creando reserva.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Crear Reserva</div>
        <div className="text-sm text-slate-500">Horario permitido: Lunes a Viernes, 07:00–20:00</div>
      </div>

      {err && <Alert type="error">{err}</Alert>}
      {result && <Alert type="success">{result}</Alert>}

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <div className="font-semibold text-slate-900">Aula</div>
          </CardHeader>
          <CardBody className="space-y-2">
            <Select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} disabled={loadingRooms}>
              <option value="" disabled>Selecciona un aula</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} | cap={c.capacity} | operativa={String(c.is_operational)}
                </option>
              ))}
            </Select>

            {selectedRoom && (
              <div className="text-xs text-slate-500">
                ID: <span className="font-mono">{selectedRoom.id}</span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-semibold text-slate-900">Fecha y hora</div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha (L–V)</label>
                <Input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
                {!weekdayOk && (
                  <div className="mt-1 text-xs text-rose-700">
                    Esta fecha cae en fin de semana. Elige lunes a viernes.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="text-slate-700">
                  Formato 00:00 (24 horas, sin AM/PM):
                </div>
                <div className="mt-1 font-mono text-xs text-slate-700">
                  {startIso} → {endIso}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-medium text-slate-700">Inicio</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Hora</label>
                    <Input
                      type="number"
                      min={MIN_HOUR}
                      max={MAX_HOUR}
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Min</label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      value={startMinute}
                      onChange={(e) => setStartMinute(Number(e.target.value))}
                    />
                  </div>
                </div>
                {!startOk && (
                  <div className="mt-2 text-xs text-rose-700">
                    Inicio debe estar entre 07:00 y 20:00 (20:00 exacto).
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-medium text-slate-700">Fin</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Hora</label>
                    <Input
                      type="number"
                      min={MIN_HOUR}
                      max={MAX_HOUR}
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Min</label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      step={5}
                      value={endMinute}
                      onChange={(e) => setEndMinute(Number(e.target.value))}
                    />
                  </div>
                </div>
                {!endOk && (
                  <div className="mt-2 text-xs text-rose-700">
                    Fin debe estar entre 07:00 y 20:00 (20:00 exacto).
                  </div>
                )}
              </div>
            </div>

            {!rangeOk && weekdayOk && startOk && endOk && (
              <Alert type="error">
                Rango inválido: la hora fin debe ser posterior a la hora inicio.
              </Alert>
            )}
          </CardBody>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Creando..." : "Crear Reserva"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setErr(null);
              setResult(null);
              setStartHour(7);
              setStartMinute(0);
              setEndHour(8);
              setEndMinute(0);
            }}
          >
            Reset horario
          </Button>
        </div>
      </form>
    </div>
  );
}
