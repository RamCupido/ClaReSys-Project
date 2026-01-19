from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def _safe(s) -> str:
    return "" if s is None else str(s)

def build_classroom_report_pdf(classroom: dict, bookings: list[dict], tickets: list[dict], from_dt: str | None, to_dt: str | None) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "ClaReSys - Classroom Usage Report")

    y -= 25
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Generated: {datetime.utcnow().isoformat()}Z")

    y -= 15
    c.drawString(50, y, f"Period: {from_dt or '-'} to {to_dt or '-'}")

    y -= 25
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Classroom Information")

    y -= 15
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Code: {_safe(classroom.get('code'))} | Capacity: {_safe(classroom.get('capacity'))} | Operational: {_safe(classroom.get('is_operational'))}")
    y -= 15
    if classroom.get("location_details"):
        c.drawString(50, y, f"Location: {_safe(classroom.get('location_details'))}")
        y -= 15

    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Bookings (latest 200)")
    y -= 15

    c.setFont("Helvetica", 9)
    if not bookings:
        c.drawString(50, y, "No bookings found.")
        y -= 15
    else:
        # header
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, y, "Start")
        c.drawString(170, y, "End")
        c.drawString(290, y, "User")
        c.drawString(420, y, "Status")
        y -= 12
        c.setFont("Helvetica", 9)

        for b in bookings[:40]:  # 40 para 1 página; luego si quieres paginación
            if y < 80:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(50, y, "Bookings (cont.)")
                y -= 20
                c.setFont("Helvetica", 9)

            c.drawString(50, y, _safe(b.get("start_time"))[:19])
            c.drawString(170, y, _safe(b.get("end_time"))[:19])
            c.drawString(290, y, _safe(b.get("user_id"))[:18])
            c.drawString(420, y, _safe(b.get("status")))
            y -= 12

    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Maintenance Tickets (latest 200)")
    y -= 15
    c.setFont("Helvetica", 9)

    if not tickets:
        c.drawString(50, y, "No maintenance tickets found.")
        y -= 15
    else:
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, y, "Ticket")
        c.drawString(150, y, "Priority")
        c.drawString(230, y, "Status")
        c.drawString(310, y, "Type")
        y -= 12
        c.setFont("Helvetica", 9)

        for t in tickets[:40]:
            if y < 80:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(50, y, "Maintenance Tickets (cont.)")
                y -= 20
                c.setFont("Helvetica", 9)

            c.drawString(50, y, _safe(t.get("ticket_id"))[:14])
            c.drawString(150, y, _safe(t.get("priority")))
            c.drawString(230, y, _safe(t.get("status")))
            c.drawString(310, y, _safe(t.get("type")))
            y -= 12

    c.showPage()
    c.save()
    return buf.getvalue()


def build_user_report_pdf(user_id: str, bookings: list[dict], from_dt: str | None, to_dt: str | None) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "ClaReSys - User Bookings Report")

    y -= 25
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Generated: {datetime.utcnow().isoformat()}Z")
    y -= 15
    c.drawString(50, y, f"User: {user_id}")
    y -= 15
    c.drawString(50, y, f"Period: {from_dt or '-'} to {to_dt or '-'}")

    y -= 25
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Bookings (latest 200)")
    y -= 15

    c.setFont("Helvetica", 9)
    if not bookings:
        c.drawString(50, y, "No bookings found.")
    else:
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, y, "Start")
        c.drawString(170, y, "End")
        c.drawString(290, y, "Classroom")
        c.drawString(420, y, "Status")
        y -= 12
        c.setFont("Helvetica", 9)

        for b in bookings[:45]:
            if y < 80:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(50, y, "Bookings (cont.)")
                y -= 20
                c.setFont("Helvetica", 9)

            c.drawString(50, y, _safe(b.get("start_time"))[:19])
            c.drawString(170, y, _safe(b.get("end_time"))[:19])
            c.drawString(290, y, _safe(b.get("classroom_id"))[:18])
            c.drawString(420, y, _safe(b.get("status")))
            y -= 12

    c.showPage()
    c.save()
    return buf.getvalue()
