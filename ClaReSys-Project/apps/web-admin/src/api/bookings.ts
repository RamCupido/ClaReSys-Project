import { http } from "./http";

export type CreateBookingRequest = {
  user_id: string;
  classroom_id: string;
  start_time: string; // "2025-10-20T12:30:00"
  end_time: string;   // "2025-10-20T13:00:00"
  subject?: string | null;
};

export type CreateBookingResponse = {
  id: string;
  status: string;   // "CONFIRMED"
  message: string;
};

export async function createBooking(payload: CreateBookingRequest): Promise<CreateBookingResponse> {
  const { data } = await http.post<CreateBookingResponse>("/api/v1/bookings/", payload);
  return data;
}

export async function cancelBooking(bookingId: string) {
  const res = await http.delete(`/api/v1/bookings/${bookingId}`);
  return res.data as {
    id: string;
    status: string;
    message: string;
  };
}

