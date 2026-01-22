from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.db import get_collection
from src.models.maintenance import oid_to_str, is_valid_object_id
from src.schemas.maintenance import (
    MaintenanceTicketCreate,
    MaintenanceTicketUpdate,
    MaintenanceTicketOut,
)
from src.events.events import EventPublisher, build_event

router = APIRouter(prefix="/api/v1/maintenance", tags=["maintenance"])

def get_publisher():
    return EventPublisher()

def _should_block(priority: str, status: str) -> bool:
    return priority == "CRITICAL" and status in ("OPEN", "IN_PROGRESS")

def _should_unblock(priority: str, status: str) -> bool:
    return priority == "CRITICAL" and status in ("RESOLVED", "CANCELLED")

@router.post("/tickets", response_model=MaintenanceTicketOut, status_code=201)
def create_ticket(
    payload: MaintenanceTicketCreate,
    col=Depends(get_collection),
    pub: EventPublisher = Depends(get_publisher),
):
    now = datetime.now(timezone.utc)
    ticket_id = str(uuid.uuid4())

    doc = {
        "ticket_id": ticket_id,
        "classroom_id": payload.classroom_id,
        "reported_by_user_id": payload.reported_by_user_id,
        "assigned_to_user_id": None,
        "type": payload.type,
        "priority": payload.priority,
        "status": "OPEN",
        "description": payload.description,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
    }

    col.insert_one(doc)

    pub.publish(
        "maintenance.ticket.created",
        build_event("maintenance-service", "maintenance.ticket.created", {
            "ticket_id": ticket_id,
            "classroom_id": payload.classroom_id,
            "priority": payload.priority,
            "status": "OPEN",
        }),
    )

    if _should_block(payload.priority, "OPEN"):
        pub.publish(
            "classroom.blocked_by_maintenance",
            build_event("maintenance-service", "classroom.blocked_by_maintenance", {
                "classroom_id": payload.classroom_id,
                "ticket_id": ticket_id,
                "reason": "CRITICAL maintenance ticket open",
            }),
        )

    pub.close()
    created = col.find_one({"ticket_id": ticket_id})
    return MaintenanceTicketOut(**oid_to_str(created))

@router.get("/tickets", response_model=dict)
def list_tickets(
    status: Optional[str] = None,
    classroom_id: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    col=Depends(get_collection),
):
    q = {}
    if status:
        q["status"] = status
    if classroom_id:
        q["classroom_id"] = classroom_id
    if priority:
        q["priority"] = priority

    total = col.count_documents(q)
    cur = col.find(q).sort("created_at", -1).skip(offset).limit(limit)
    items = [MaintenanceTicketOut(**oid_to_str(d)).model_dump() for d in cur]
    return {"total": total, "items": items}

@router.get("/tickets/{ticket_id}", response_model=MaintenanceTicketOut)
def get_ticket(ticket_id: str, col=Depends(get_collection)):
    doc = col.find_one({"ticket_id": ticket_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")
    return MaintenanceTicketOut(**oid_to_str(doc))

@router.patch("/tickets/{ticket_id}", response_model=MaintenanceTicketOut)
def update_ticket(
    ticket_id: str,
    patch: MaintenanceTicketUpdate,
    col=Depends(get_collection),
    pub: EventPublisher = Depends(get_publisher),
):
    doc = col.find_one({"ticket_id": ticket_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found")

    now = datetime.now(timezone.utc)
    update = {"updated_at": now}

    if patch.assigned_to_user_id is not None:
        update["assigned_to_user_id"] = patch.assigned_to_user_id
    if patch.type is not None:
        update["type"] = patch.type
    if patch.priority is not None:
        update["priority"] = patch.priority
    if patch.description is not None:
        update["description"] = patch.description
    if patch.status is not None:
        update["status"] = patch.status
        if patch.status == "RESOLVED":
            update["resolved_at"] = now
        if patch.status == "CANCELLED":
            update["resolved_at"] = None

    prev_priority = doc["priority"]
    prev_status = doc["status"]

    col.update_one({"ticket_id": ticket_id}, {"$set": update})

    new_doc = col.find_one({"ticket_id": ticket_id})
    new_priority = new_doc["priority"]
    new_status = new_doc["status"]

    pub.publish(
        "maintenance.ticket.updated",
        build_event("maintenance-service", "maintenance.ticket.updated", {
            "ticket_id": ticket_id,
            "classroom_id": new_doc["classroom_id"],
            "priority": new_priority,
            "status": new_status,
        }),
    )

    if prev_status != "RESOLVED" and new_status == "RESOLVED":
        pub.publish(
            "maintenance.ticket.resolved",
            build_event("maintenance-service", "maintenance.ticket.resolved", {
                "ticket_id": ticket_id,
                "classroom_id": new_doc["classroom_id"],
            }),
        )

    if prev_status != "CANCELLED" and new_status == "CANCELLED":
        pub.publish(
            "maintenance.ticket.canceled",
            build_event("maintenance-service", "maintenance.ticket.canceled", {
                "ticket_id": ticket_id,
                "classroom_id": new_doc["classroom_id"],
            }),
        )

    if not _should_block(prev_priority, prev_status) and _should_block(new_priority, new_status):
        pub.publish(
            "classroom.blocked_by_maintenance",
            build_event("maintenance-service", "classroom.blocked_by_maintenance", {
                "classroom_id": new_doc["classroom_id"],
                "ticket_id": ticket_id,
                "reason": "CRITICAL maintenance ticket active",
            }),
        )

    if _should_block(prev_priority, prev_status) and _should_unblock(new_priority, new_status):
        pub.publish(
            "classroom.unblocked_by_maintenance",
            build_event("maintenance-service", "classroom.unblocked_by_maintenance", {
                "classroom_id": new_doc["classroom_id"],
                "ticket_id": ticket_id,
                "reason": "CRITICAL maintenance ticket closed",
            }),
        )

    pub.close()
    return MaintenanceTicketOut(**oid_to_str(new_doc))
