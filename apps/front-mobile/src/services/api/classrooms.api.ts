import { api } from "./client";

export type Classroom = {
  id: string;
  code: string;
  capacity: number;
  location_details: string;
  is_operational: boolean;
};

export const classroomsApi = {
  async listOperational() {
    const { data } = await api.get<Classroom[]>("/api/v1/classrooms/");
    return data.filter((c) => c.is_operational);
  },
};
