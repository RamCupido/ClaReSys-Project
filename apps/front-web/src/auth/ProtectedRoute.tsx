import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({
  children,
  allowRoles,
}: {
  children: React.ReactNode;
  allowRoles?: string[];
}) {
  const { token, role } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (allowRoles && (!role || !allowRoles.includes(role))) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
