import { http } from "./http";

export type Classroom = {
  id: string;
  code: string;
  capacity: number;
  location_details: string | null;
  is_operational: boolean;
};

export type CreateClassroomRequest = {
  code: string;
  capacity: number;
  is_operational: boolean;
  location_details?: string | null; // opcional; tu POST no lo envía
};

export async function listClassrooms(): Promise<Classroom[]> {
  const { data } = await http.get<Classroom[]>("/api/v1/classrooms/");
  return data;
}

export async function createClassroom(payload: CreateClassroomRequest): Promise<Classroom> {
  const { data } = await http.post<Classroom>("/api/v1/classrooms/", payload);
  return data;
}
