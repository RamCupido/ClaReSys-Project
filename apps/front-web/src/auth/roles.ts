export const Roles = {
  ADMIN: "ADMIN",
  DOCENTE: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type Role = typeof Roles[keyof typeof Roles];
