export const Roles = {
  ADMIN: "ADMIN",
  DOCENTE: "TEACHER"
} as const;

export type Role = typeof Roles[keyof typeof Roles];
