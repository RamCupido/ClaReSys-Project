from bson import ObjectId

def oid_to_str(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc

def is_valid_object_id(value: str) -> bool:
    try:
        ObjectId(value)
        return True
    except Exception:
        return False
