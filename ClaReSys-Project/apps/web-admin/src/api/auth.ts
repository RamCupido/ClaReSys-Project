import { http } from "./http";

export type LoginRequest = { email: string; password: string };

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
};

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/api/v1/auth/login", req);
  return data;
}
