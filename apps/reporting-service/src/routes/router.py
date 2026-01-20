from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import Response

from src.http_clients import (
    fetch_classroom,
    fetch_bookings_for_classroom,
    fetch_bookings_for_user,
    fetch_maintenance_tickets,
    UpstreamError,
)
from src.pdf_builder import build_classroom_report_pdf, build_user_report_pdf

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

@router.get("/classroom/{classroom_id}")
async def report_classroom(
    classroom_id: str,
    from_dt: str | None = Query(default=None, alias="from"),
    to_dt: str | None = Query(default=None, alias="to"),
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    try:
        classroom = await fetch_classroom(classroom_id, authorization)
        bookings_resp = await fetch_bookings_for_classroom(classroom_id, authorization)
        tickets_resp = await fetch_maintenance_tickets(classroom_id, authorization)

        bookings = bookings_resp.get("items", bookings_resp)  # por si tu API devuelve lista directa
        tickets = tickets_resp.get("items", tickets_resp)

        pdf_bytes = build_classroom_report_pdf(classroom, bookings, tickets, from_dt, to_dt)

        filename = f"classroom-report-{classroom_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    except UpstreamError as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/user/{user_id}")
async def report_user(
    user_id: str,
    from_dt: str | None = Query(default=None, alias="from"),
    to_dt: str | None = Query(default=None, alias="to"),
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    try:
        bookings_resp = await fetch_bookings_for_user(user_id, authorization)
        bookings = bookings_resp.get("items", bookings_resp)

        pdf_bytes = build_user_report_pdf(user_id, bookings, from_dt, to_dt)

        filename = f"user-report-{user_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    except UpstreamError as e:
        raise HTTPException(status_code=502, detail=str(e))
