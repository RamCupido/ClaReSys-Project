import { http } from "./http";

export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  is_active: boolean;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  role?: User["role"];
};

export type UpdateUserRequest = Partial<{
  email: string;
  password: string;
  role: User["role"];
  is_active: boolean;
}>;

export type ListUsersParams = Partial<{
  skip: number;
  limit: number;
}>;

export async function createUser(payload: CreateUserRequest): Promise<User> {
  const { data } = await http.post<User>("/api/v1/users/", payload);
  return data;
}

export async function listUsers(params: ListUsersParams = {}): Promise<User[]> {
  const { data } = await http.get<User[]>("/api/v1/users/", { params });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await http.get<User>(`/api/v1/users/${id}`);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserRequest): Promise<User> {
  const { data } = await http.patch<User>(`/api/v1/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/api/v1/users/${id}`);
}
