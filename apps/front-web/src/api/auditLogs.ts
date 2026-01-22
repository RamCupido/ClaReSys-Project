import { http } from "./http";

export type AuditLog = {
  _id: string;
  timestamp?: string;
  service?: string;
  actor_user_id?: string;
  action?: string;
  resource_id?: string;
  correlation_id?: string;
  payload?: any;
  [k: string]: any;
};

export type AuditListResponse = { total: number; items: AuditLog[] };

export type ListAuditLogsParams = Partial<{
  from: string;
  to: string;
  service: string;
  actor_user_id: string;
  action: string;
  resource_id: string;
  correlation_id: string;
  limit: number;
  offset: number;
}>;

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditListResponse> {
  const { data } = await http.get<AuditListResponse>("/api/v1/audit-logs/", { params });
  return data;
}

export async function getAuditLog(logId: string): Promise<AuditLog> {
  const { data } = await http.get<AuditLog>(`/api/v1/audit-logs/${logId}`);
  return data;
}
