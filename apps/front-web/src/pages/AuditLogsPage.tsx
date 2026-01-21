import { useEffect, useState } from "react";
import { listAuditLogs, getAuditLog } from "../api/auditLogs";
import type { AuditLog } from "../api/auditLogs";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Alert from "../ui/Alert";
import { Card, CardBody, CardHeader } from "../ui/Card";

function toIsoNoZ(dtLocal: string) {
  return dtLocal && dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);

  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");
  const [service, setService] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [action, setAction] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [correlationId, setCorrelationId] = useState("");

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [selected, setSelected] = useState<AuditLog | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listAuditLogs({
        from: fromLocal ? toIsoNoZ(fromLocal) : undefined,
        to: toLocal ? toIsoNoZ(toLocal) : undefined,
        service: service || undefined,
        actor_user_id: actorUserId || undefined,
        action: action || undefined,
        resource_id: resourceId || undefined,
        correlation_id: correlationId || undefined,
        limit,
        offset,
      });
      setTotal(res.total);
      setItems(res.items);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Error cargando audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    
  }, [fromLocal, toLocal, service, actorUserId, action, resourceId, correlationId, limit, offset]);

  const openLog = async (id: string) => {
    setErr(null);
    try {
      const doc = await getAuditLog(id);
      setSelected(doc);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "No se pudo cargar el log.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Audit Logs</div>
        <div className="text-sm text-slate-500">Visible solo para ADMIN.</div>
      </div>

      {err && <Alert type="error">{err}</Alert>}

      <Card>
        <CardHeader>
          <div className="font-semibold text-slate-900">Filtros</div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">From</label>
              <Input type="datetime-local" value={fromLocal} onChange={(e) => { setOffset(0); setFromLocal(e.target.value); }} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">To</label>
              <Input type="datetime-local" value={toLocal} onChange={(e) => { setOffset(0); setToLocal(e.target.value); }} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Service</label>
              <Input value={service} onChange={(e) => { setOffset(0); setService(e.target.value); }} placeholder="booking-command, maintenance-service..." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">actor_user_id</label>
              <Input value={actorUserId} onChange={(e) => { setOffset(0); setActorUserId(e.target.value); }} placeholder="UUID" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">action</label>
              <Input value={action} onChange={(e) => { setOffset(0); setAction(e.target.value); }} placeholder="CREATE_BOOKING, UPDATE_TICKET..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">resource_id</label>
              <Input value={resourceId} onChange={(e) => { setOffset(0); setResourceId(e.target.value); }} placeholder="booking_id, ticket_id..." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">correlation_id</label>
              <Input value={correlationId} onChange={(e) => { setOffset(0); setCorrelationId(e.target.value); }} placeholder="request id / correlation id" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Limit</label>
              <Input type="number" min={1} max={200} value={limit} onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }} />
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setFromLocal(""); setToLocal(""); setService("");
                  setActorUserId(""); setAction(""); setResourceId(""); setCorrelationId("");
                  setLimit(50); setOffset(0);
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>

          <div className="text-xs text-slate-500">Total: {total} | Offset: {offset}</div>

          <div className="flex gap-2">
            <Button variant="secondary" disabled={!canPrev || loading} onClick={() => setOffset((o) => Math.max(0, o - limit))}>Anterior</Button>
            <Button variant="secondary" disabled={!canNext || loading} onClick={() => setOffset((o) => o + limit)}>Siguiente</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-semibold text-slate-900">Listado</div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-2">timestamp</th>
                  <th className="py-2">service</th>
                  <th className="py-2">action</th>
                  <th className="py-2">actor_user_id</th>
                  <th className="py-2">resource_id</th>
                  <th className="py-2">detalle</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">Cargando...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">Sin resultados.</td></tr>
                ) : (
                  items.map((l) => (
                    <tr key={l._id} className="border-b hover:bg-slate-50">
                      <td className="py-2 font-mono text-xs">{l.timestamp ?? "-"}</td>
                      <td className="py-2">{l.service ?? "-"}</td>
                      <td className="py-2">{l.action ?? "-"}</td>
                      <td className="py-2 font-mono text-xs">{l.actor_user_id ?? "-"}</td>
                      <td className="py-2 font-mono text-xs">{l.resource_id ?? "-"}</td>
                      <td className="py-2">
                        <Button variant="secondary" onClick={() => openLog(l._id)}>Ver</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Audit Log</div>
                <div className="text-xs font-mono text-slate-500">{selected._id}</div>
              </div>
              <Button variant="ghost" onClick={() => setSelected(null)}>Cerrar</Button>
            </div>

            <pre className="max-h-[60vh] overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
