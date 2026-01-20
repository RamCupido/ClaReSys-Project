import { http } from "./http";

export type BookingView = {
  booking_id: string;
  user_id?: string | null;
  classroom_id?: string | null;
  status?: string | null;

  // extra="allow" en backend: pueden venir start_time, end_time, etc.
  start_time?: string;
  end_time?: string;
  [k: string]: any;
};

export type BookingListResponse = {
  total: number;
  items: BookingView[];
};

export type ListBookingsParams = Partial<{
  user_id: string;
  classroom_id: string;
  status_filter: string;
  limit: number;
  offset: number;
}>;

export async function listBookings(params: ListBookingsParams = {}): Promise<BookingListResponse> {
  const { data } = await http.get<BookingListResponse>("/api/v1/queries/bookings", { params });
  return data;
}

export async function getBooking(bookingId: string): Promise<BookingView> {
  const { data } = await http.get<BookingView>(`/api/v1/queries/bookings/${bookingId}`);
  return data;
}
