import React, { createContext, useContext, useMemo, useState } from "react";
import { storage } from "./storage";
import type { LoginRequest } from "../api/auth";
import { login as loginApi} from "../api/auth";

type AuthState = {
  token: string | null;
  role: string | null;
  userId: string | null;
};

type AuthContextValue = AuthState & {
  login: (req: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(storage.getToken());
  const [role, setRole] = useState(storage.getRole());
  const [userId, setUserId] = useState(storage.getUserId());

  const value = useMemo<AuthContextValue>(() => ({
    token, role, userId,
    login: async (req) => {
      const res = await loginApi(req);
      storage.setToken(res.access_token);
      storage.setRole(res.role);
      storage.setUserId(res.user_id);
      storage.setEmail(req.email);
      setToken(res.access_token);
      setRole(res.role);
      setUserId(res.user_id);
    },
    logout: () => {
      storage.clearAll();
      setToken(null); setRole(null); setUserId(null);
    }
  }), [token, role, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
