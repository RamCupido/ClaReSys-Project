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
  location_details?: string | null;
};

export type UpdateClassroomRequest = Partial<CreateClassroomRequest>;

export type ListClassroomsParams = Partial<{
  skip: number;
  limit: number;
  only_operational: boolean;
}>;

export async function createClassroom(payload: CreateClassroomRequest): Promise<Classroom> {
  const { data } = await http.post<Classroom>("/api/v1/classrooms/", payload);
  return data;
}

export async function listClassrooms(params: ListClassroomsParams = {}): Promise<Classroom[]> {
  const { data } = await http.get<Classroom[]>("/api/v1/classrooms/", { params });
  return data;
}

export async function getClassroom(id: string): Promise<Classroom> {
  const { data } = await http.get<Classroom>(`/api/v1/classrooms/${id}`);
  return data;
}

export async function updateClassroom(id: string, payload: UpdateClassroomRequest): Promise<Classroom> {
  const { data } = await http.patch<Classroom>(`/api/v1/classrooms/${id}`, payload);
  return data;
}

export async function deleteClassroom(id: string): Promise<void> {
  await http.delete(`/api/v1/classrooms/${id}`);
}
