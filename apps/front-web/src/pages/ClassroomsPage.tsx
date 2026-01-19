import { useEffect, useMemo, useState } from "react";
import {
  createClassroom,
  deleteClassroom,
  listClassrooms,
  updateClassroom,
} from "../api/classrooms";
import type { Classroom } from "../api/classrooms";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Alert from "../ui/Alert";
import { Card, CardBody, CardHeader } from "../ui/Card";

export default function ClassroomsPage() {
  const [items, setItems] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Create form
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState<number>(50);
  const [isOperational, setIsOperational] = useState<boolean>(true);
  const [locationDetails, setLocationDetails] = useState<string>("");

  // Filter
  const [onlyOperational, setOnlyOperational] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState<Classroom | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editCapacity, setEditCapacity] = useState<number>(50);
  const [editOperational, setEditOperational] = useState<boolean>(true);
  const [editLocation, setEditLocation] = useState<string>("");

  const canCreate = code.trim().length > 0 && capacity > 0;

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listClassrooms({
        skip: 0,
        limit: 200,
        only_operational: onlyOperational || undefined,
      });
      setItems(data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando aulas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyOperational]);

  const onCreate = async () => {
    setErr(null);
    setMsg(null);
    try {
      await createClassroom({
        code: code.trim(),
        capacity,
        is_operational: isOperational,
        location_details: locationDetails.trim() ? locationDetails.trim() : null,
      });
      setCode("");
      setCapacity(50);
      setIsOperational(true);
      setLocationDetails("");
      setMsg("Aula creada correctamente.");
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) setErr("El código del aula ya está registrado.");
      else setErr(e?.response?.data?.detail ?? "Error creando aula.");
    }
  };

  const openEdit = (c: Classroom) => {
    setMsg(null);
    setErr(null);
    setEditing(c);
    setEditCode(c.code);
    setEditCapacity(c.capacity);
    setEditOperational(c.is_operational);
    setEditLocation(c.location_details ?? "");
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const onSaveEdit = async () => {
    if (!editing) return;

    setErr(null);
    setMsg(null);

    // Payload parcial: solo campos editables (PATCH)
    const payload: any = {
      code: editCode.trim(),
      capacity: editCapacity,
      is_operational: editOperational,
      location_details: editLocation.trim() ? editLocation.trim() : null,
    };

    try {
      await updateClassroom(editing.id, payload);
      setMsg("Aula actualizada correctamente.");
      closeEdit();
      await load();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) setErr("El código del aula ya está registrado.");
      else setErr(e?.response?.data?.detail ?? "Error actualizando aula.");
    }
  };

  const onDelete = async (c: Classroom) => {
    setErr(null);
    setMsg(null);

    const ok = window.confirm(`¿Eliminar el aula ${c.code}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    try {
      await deleteClassroom(c.id);
      setMsg("Aula eliminada correctamente.");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error eliminando aula.");
    }
  };

  const tableRows = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Aulas</div>
        <div className="text-sm text-slate-500">CRUD completo (crear, editar, eliminar).</div>
      </div>

      {err && <Alert type="error">{err}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {/* Create */}
      <Card>
        <CardHeader>
          <div className="font-semibold text-slate-900">Crear aula</div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Código</label>
              <Input
                placeholder="Ej: LAB-3"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Capacidad</label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Operativa</label>
              <Select
                value={String(isOperational)}
                onChange={(e) => setIsOperational(e.target.value === "true")}
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Localización</label>
              <Input
                placeholder='Ej: "Edificio CISCO"'
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onCreate} disabled={!canCreate}>Crear</Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setCode(""); setCapacity(50); setIsOperational(true); setLocationDetails("");
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={onlyOperational}
          onChange={(e) => setOnlyOperational(e.target.checked)}
        />
        <span className="text-sm text-slate-700">Solo operativas</span>

        <Button variant="ghost" onClick={load} disabled={loading}>
          {loading ? "Cargando..." : "Refrescar"}
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="font-semibold text-slate-900">Listado</div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2">Código</th>
                  <th className="py-2">Capacidad</th>
                  <th className="py-2">Operativa</th>
                  <th className="py-2">Localización</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 font-medium text-slate-900">{c.code}</td>
                    <td className="py-2">{c.capacity}</td>
                    <td className="py-2">{String(c.is_operational)}</td>
                    <td className="py-2">{c.location_details ?? "-"}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                        <Button variant="danger" onClick={() => onDelete(c)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No hay aulas para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4">
              <div className="text-lg font-semibold text-slate-900">Editar aula</div>
              <div className="text-xs text-slate-500 font-mono">{editing.id}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Código</label>
                <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Capacidad</label>
                <Input
                  type="number"
                  min={1}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Operativa</label>
                <Select
                  value={String(editOperational)}
                  onChange={(e) => setEditOperational(e.target.value === "true")}
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Localización</label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={closeEdit}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={onSaveEdit}
                disabled={!editCode.trim() || editCapacity <= 0}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
