import { create } from "zustand";
import { getToken, setToken, clearToken } from "../services/storage/token.storage";
import { authApi } from "../services/api/auth.api";

type AuthState = {
  token: string | null;
  userId: string | null;
  role: string | null;
  isLoading: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  role: null,
  isLoading: true,

  bootstrap: async () => {
    const token = await getToken();
    set({ token: token ?? null, isLoading: false });
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    set({
      token: res.access_token,
      userId: res.user_id,
      role: res.role,
    });
  },

  logout: async () => {
    await clearToken();
    set({ token: null, userId: null, role: null });
  },
}));
