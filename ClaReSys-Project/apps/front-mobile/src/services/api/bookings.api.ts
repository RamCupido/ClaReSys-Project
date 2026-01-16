import { api } from "./client";

export type Booking = {
  booking_id: string;
  user_id: string;
  classroom_id: string;
  status: string;
  start_time: string;
  end_time: string;
  subject?: string;
};

export const bookingsApi = {
  async list() {
    const { data } = await api.get<{ total: number; items: Booking[] }>(
      "/api/v1/queries/bookings"
    );
    return data.items;
  },
};
