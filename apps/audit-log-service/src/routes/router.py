from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from src.config.db import get_collection
from src.models.audit import is_valid_object_id, oid_to_str
from src.schemas.audit import AuditLogIn, AuditLogOut

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])

def _build_filters(
    from_dt: Optional[datetime],
    to_dt: Optional[datetime],
    service: Optional[str],
    actor_user_id: Optional[str],
    action: Optional[str],
    resource_id: Optional[str],
    correlation_id: Optional[str],
):
    q: dict = {}

    if from_dt or to_dt:
        q["timestamp"] = {}
        if from_dt:
            q["timestamp"]["$gte"] = from_dt
        if to_dt:
            q["timestamp"]["$lte"] = to_dt

    if service:
        q["service"] = service
    if actor_user_id:
        q["actor_user_id"] = actor_user_id
    if action:
        q["action"] = action
    if resource_id:
        q["resource_id"] = resource_id
    if correlation_id:
        q["correlation_id"] = correlation_id

    return q

@router.post("/", response_model=AuditLogOut, status_code=201)
def create_audit_log(payload: AuditLogIn, col=Depends(get_collection)):
    doc = payload.model_dump()
    res = col.insert_one(doc)
    doc["_id"] = res.inserted_id
    return oid_to_str(doc)

@router.get("/", response_model=dict)
def list_audit_logs(
    from_dt: Optional[datetime] = Query(default=None, alias="from"),
    to_dt: Optional[datetime] = Query(default=None, alias="to"),
    service: Optional[str] = None,
    actor_user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    col=Depends(get_collection),
):
    q = _build_filters(from_dt, to_dt, service, actor_user_id, action, resource_id, correlation_id)
    total = col.count_documents(q)
    cur = (
        col.find(q)
        .sort("timestamp", -1)
        .skip(offset)
        .limit(limit)
    )
    items = [oid_to_str(doc) for doc in cur]
    return {"total": total, "items": items}

@router.get("/{log_id}", response_model=AuditLogOut)
def get_audit_log(log_id: str, col=Depends(get_collection)):
    if not is_valid_object_id(log_id):
        raise HTTPException(status_code=400, detail="Invalid audit log id")

    doc = col.find_one({"_id": ObjectId(log_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return oid_to_str(doc)
