import { Link } from "react-router-dom";

export default function BookingsPage() {
  return (
    <div>
      <h2>Reservas</h2>

      <div style={{ margin: "12px 0", padding: 12, border: "1px solid #ddd" }}>
        <p style={{ marginTop: 0 }}>
          El listado de reservas se habilitará cuando esté disponible el endpoint de lectura
          (Query) en <code>/api/v1/queries/...</code>.
        </p>

        <Link to="/admin/bookings/create">Ir a Crear Reserva</Link>
      </div>
    </div>
  );
}
