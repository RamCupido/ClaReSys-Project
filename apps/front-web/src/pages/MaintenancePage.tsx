import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { createTicket, listTickets, updateTicket } from "../api/maintenance";
import type { MaintenanceTicket } from "../api/maintenance";
import { listClassrooms } from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Alert from "../ui/Alert";
import { Card, CardBody, CardHeader } from "../ui/Card";

const priorities = ["BAJO", "MEDIO", "ALTO", "CRITICO"];
const statuses = ["ABIERTO", "EN_PROCESO", "RESUELTO", "CANCELADO"];
const types = ["ELECTRICO", "RED", "PROYECTOR", "INFRAESTRUCTURA", "OTRO"];

export default function MaintenancePage() {
  const { userId, role } = useAuth();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const classroomMap = useMemo(() => {
    const m: Record<string, string> = {};
    classrooms.forEach((c) => (m[c.id] = c.code));
    return m;
  }, [classrooms]);

  const [classroomId, setClassroomId] = useState("");
  const [type, setType] = useState(types[0]);
  const [priority, setPriority] = useState(priorities[1]);
  const [description, setDescription] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [items, setItems] = useState<MaintenanceTicket[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<MaintenanceTicket | null>(null);
  const [editStatus, setEditStatus] = useState<string>("ABIERTO");
  const [editPriority, setEditPriority] = useState<string>("MEEDIO");
  const [editType, setEditType] = useState<string>("OTRO");
  const [editDescription, setEditDescription] = useState<string>("");

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const loadCatalog = async () => {
    try {
      const cls = await listClassrooms({ skip: 0, limit: 500 });
      setClassrooms(cls);
      if (!classroomId && cls[0]) setClassroomId(cls[0].id);
    } catch {

    }
  };

  const loadTickets = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        classroom_id: classroomFilter || undefined,
        limit,
        offset,
      });
      setTotal(res.total);
      setItems(res.items);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    loadTickets();

  }, [statusFilter, priorityFilter, classroomFilter, limit, offset]);

  const onCreate = async () => {
    setErr(null);
    setMsg(null);
    if (!userId) {
      setErr("No userId en sesión.");
      return;
    }
    if (!classroomId || !description.trim()) {
      setErr("Completa aula y descripción.");
      return;
    }

    try {
      await createTicket({
        classroom_id: classroomId,
        reported_by_user_id: userId,
        type,
        priority,
        description: description.trim(),
      });
      setMsg("Ticket creado correctamente.");
      setDescription("");
      setOffset(0);
      await loadTickets();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error creando ticket.");
    }
  };

  const openEdit = (t: MaintenanceTicket) => {
    setEditing(t);
    setEditStatus(t.status);
    setEditPriority(t.priority);
    setEditType(t.type);
    setEditDescription(t.description);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setErr(null);
    setMsg(null);
    try {
      await updateTicket(editing.ticket_id, {
        status: editStatus,
        priority: editPriority,
        type: editType,
        description: editDescription,
      });
      setMsg("Ticket actualizado.");
      setEditing(null);
      await loadTickets();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error actualizando ticket.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Mantenimiento</div>
        <div className="text-sm text-slate-500">
          Tickets (ADMIN y TEACHER pueden crear). Admin puede gestionar.
        </div>
      </div>

      {err && <Alert type="error">{err}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <Card>
        <CardHeader>
          <div className="font-semibold text-slate-900">Crear ticket</div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Aula</label>
              <Select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
                <option value="" disabled>Selecciona</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prioridad</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button onClick={onCreate} disabled={!classroomId || !description.trim()}>Crear</Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Ej: "Proyector no enciende"' />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-semibold text-slate-900">Listado</div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onChange={(e) => { setOffset(0); setStatusFilter(e.target.value); }}>
                <option value="">(todos)</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <Select value={priorityFilter} onChange={(e) => { setOffset(0); setPriorityFilter(e.target.value); }}>
                <option value="">(todas)</option>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Aula</label>
              <Select value={classroomFilter} onChange={(e) => { setOffset(0); setClassroomFilter(e.target.value); }}>
                <option value="">(todas)</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Limit</label>
              <Input type="number" min={1} max={200} value={limit} onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" disabled={!canPrev || loading} onClick={() => setOffset((o) => Math.max(0, o - limit))}>Anterior</Button>
            <Button variant="secondary" disabled={!canNext || loading} onClick={() => setOffset((o) => o + limit)}>Siguiente</Button>
            <Button variant="ghost" onClick={() => { setStatusFilter(""); setPriorityFilter(""); setClassroomFilter(""); setLimit(50); setOffset(0); }}>
              Limpiar
            </Button>
          </div>

          <div className="text-xs text-slate-500">Total: {total} | Offset: {offset}</div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2">ticket_id</th>
                  <th className="py-2">aula</th>
                  <th className="py-2">pprioridad</th>
                  <th className="py-2">status</th>
                  <th className="py-2">tipo</th>
                  <th className="py-2">descripcion</th>
                  <th className="py-2">acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Cargando...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Sin resultados.</td></tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.ticket_id} className="border-b hover:bg-slate-50">
                      <td className="py-2 font-mono text-xs">{t.ticket_id}</td>
                      <td className="py-2">{classroomMap[t.classroom_id] ?? t.classroom_id}</td>
                      <td className="py-2">{t.priority}</td>
                      <td className="py-2">{t.status}</td>
                      <td className="py-2">{t.type}</td>
                      <td className="py-2">{t.description}</td>
                      <td className="py-2">
                        {/* TEACHER puede crear; gestión fina la dejamos a admin */}
                        {role === "ADMIN" ? (
                          <Button variant="secondary" onClick={() => openEdit(t)}>Editar</Button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Editar ticket</div>
                <div className="text-xs font-mono text-slate-500">{editing.ticket_id}</div>
              </div>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cerrar</Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                <Select value={editType} onChange={(e) => setEditType(e.target.value)}>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
