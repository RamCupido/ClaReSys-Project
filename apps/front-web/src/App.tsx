import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Roles } from "./auth/roles";

import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/AdminLayout";
import ClassroomsPage from "./pages/ClassroomsPage";
import CreateBookingPage from "./pages/CreateBookingPage";
import NotFound from "./pages/NotFound";
import BookingsPage from "./pages/BookingsPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherBookingsPage from "./pages/TeacherBookingsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowRoles={[Roles.ADMIN]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="classrooms" replace />} />
            <Route path="classrooms" element={<ClassroomsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/create" element={<CreateBookingPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowRoles={[Roles.DOCENTE]}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="bookings" replace />} />
            <Route path="bookings" element={<TeacherBookingsPage />} />
            <Route path="bookings/create" element={<CreateBookingPage />} />
          </Route>


          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
