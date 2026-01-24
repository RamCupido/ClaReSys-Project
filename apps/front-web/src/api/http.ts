import axios from "axios";
import { storage } from "../auth/storage";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const http = axios.create({
  baseURL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      storage.clearAll();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
