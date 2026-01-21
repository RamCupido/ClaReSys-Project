import { http } from "./http";

export type MaintenanceTicket = {
  ticket_id: string;
  classroom_id: string;
  reported_by_user_id: string;
  assigned_to_user_id: string | null;
  type: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  [k: string]: any;
};

export type TicketsListResponse = { total: number; items: MaintenanceTicket[] };

export type CreateTicketRequest = {
  classroom_id: string;
  reported_by_user_id: string;
  type: string;
  priority: string;
  description: string;
};

export type UpdateTicketRequest = Partial<{
  assigned_to_user_id: string | null;
  type: string;
  priority: string;
  description: string;
  status: string;
}>;

export type ListTicketsParams = Partial<{
  status: string;
  classroom_id: string;
  priority: string;
  limit: number;
  offset: number;
}>;

export async function createTicket(payload: CreateTicketRequest): Promise<MaintenanceTicket> {
  const { data } = await http.post<MaintenanceTicket>("/api/v1/maintenance/tickets", payload);
  return data;
}

export async function listTickets(params: ListTicketsParams = {}): Promise<TicketsListResponse> {
  const { data } = await http.get<TicketsListResponse>("/api/v1/maintenance/tickets", { params });
  return data;
}

export async function getTicket(ticketId: string): Promise<MaintenanceTicket> {
  const { data } = await http.get<MaintenanceTicket>(`/api/v1/maintenance/tickets/${ticketId}`);
  return data;
}

export async function updateTicket(ticketId: string, patch: UpdateTicketRequest): Promise<MaintenanceTicket> {
  const { data } = await http.patch<MaintenanceTicket>(`/api/v1/maintenance/tickets/${ticketId}`, patch);
  return data;
}
