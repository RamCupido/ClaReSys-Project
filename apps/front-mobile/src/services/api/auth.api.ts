import { api } from "./client";
import { setToken } from "../storage/token.storage";

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
};

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/api/v1/auth/login", {
      email,
      password,
    });

    if (typeof data.access_token !== "string" || !data.access_token.length) {
      throw new Error("Login OK pero access_token inválido");
    }

    await setToken(data.access_token);
    return data;
  },
};
