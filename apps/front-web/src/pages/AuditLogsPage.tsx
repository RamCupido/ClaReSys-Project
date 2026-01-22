import { useEffect, useMemo, useRef, useState } from "react";
import { listAuditLogs } from "../api/auditLogs";
import type { AuditLog } from "../api/auditLogs";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Alert from "../ui/Alert";
import { Card, CardBody, CardHeader } from "../ui/Card";

function localDatetimeToUtcIso(dtLocal: string) {
  if (!dtLocal || dtLocal.length !== 16) return undefined;
  const d = new Date(dtLocal);
  return d.toISOString();
}

function clampLimit(n: number) {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, n));
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

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const debounceRef = useRef<number | null>(null);
  const reqSeq = useRef(0);

  const query = useMemo(() => ({
    from: localDatetimeToUtcIso(fromLocal),
    to: localDatetimeToUtcIso(toLocal),
    service: service || undefined,
    actor_user_id: actorUserId || undefined,
    action: action || undefined,
    resource_id: resourceId || undefined,
    correlation_id: correlationId || undefined,
    limit,
    offset,
  }), [fromLocal, toLocal, service, actorUserId, action, resourceId, correlationId, limit, offset]);

  const load = async () => {
    const current = ++reqSeq.current;
    setLoading(true);
    setErr(null);

    try {
      const res = await listAuditLogs(query);
      if (current !== reqSeq.current) return;

      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      if (current !== reqSeq.current) return;
      setErr(e?.response?.data?.detail ?? "Error cargando audit logs.");
    } finally {
      if (current === reqSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(load, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
              <label className="text-sm font-medium text-slate-700">Desde</label>
              <Input type="datetime-local" value={fromLocal} onChange={(e) => { setOffset(0); setFromLocal(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Hasta</label>
              <Input type="datetime-local" value={toLocal} onChange={(e) => { setOffset(0); setToLocal(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Servicio</label>
              <Input value={service} onChange={(e) => { setOffset(0); setService(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Usuario (ID)</label>
              <Input value={actorUserId} onChange={(e) => { setOffset(0); setActorUserId(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Acción</label>
              <Input value={action} onChange={(e) => { setOffset(0); setAction(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Recurso</label>
              <Input value={resourceId} onChange={(e) => { setOffset(0); setResourceId(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">ID Correlación</label>
              <Input value={correlationId} onChange={(e) => { setOffset(0); setCorrelationId(e.target.value); }} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Límite</label>
              <Input
                type="number"
                min={1}
                max={200}
                value={limit}
                onChange={(e) => { setOffset(0); setLimit(clampLimit(Number(e.target.value))); }}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
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
            <Button variant="secondary" disabled={!canPrev || loading} onClick={() => setOffset((o) => Math.max(0, o - limit))}>
              Anterior
            </Button>
            <Button variant="secondary" disabled={!canNext || loading} onClick={() => setOffset((o) => o + limit)}>
              Siguiente
            </Button>
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
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Servicio</th>
                  <th className="py-2">Método</th>
                  <th className="py-2">Path</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Usuario</th>
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
                      <td className="py-2 font-mono text-xs">{(l as any).method ?? "-"}</td>
                      <td className="py-2 font-mono text-xs">{(l as any).path ?? "-"}</td>
                      <td className="py-2 font-mono text-xs">{(l as any).status_code ?? "-"}</td>
                      <td className="py-2 font-mono text-xs">{l.actor_user_id ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
