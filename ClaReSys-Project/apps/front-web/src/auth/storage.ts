const TOKEN_KEY = "claresys_token";
const ROLE_KEY = "claresys_role";
const USER_ID_KEY = "claresys_user_id";
const EMAIL_KEY = "claresys_email";

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  getRole: () => localStorage.getItem(ROLE_KEY),
  setRole: (r: string) => localStorage.setItem(ROLE_KEY, r),
  clearRole: () => localStorage.removeItem(ROLE_KEY),

  getUserId: () => localStorage.getItem(USER_ID_KEY),
  setUserId: (id: string) => localStorage.setItem(USER_ID_KEY, id),
  clearUserId: () => localStorage.removeItem(USER_ID_KEY),

  getEmail: () => localStorage.getItem(EMAIL_KEY),
  setEmail: (e: string) => localStorage.setItem(EMAIL_KEY, e),
  clearEmail: () => localStorage.removeItem(EMAIL_KEY),

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },
};
