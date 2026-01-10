import os
import grpc
from datetime import datetime, timezone
from typing import List, Tuple

from src.domain.ports import TimetableGateway
import src.timetable_pb2 as pb2
import src.timetable_pb2_grpc as pb2_grpc


class TimetableUnavailableError(Exception):
    pass


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class GrpcTimetableGateway(TimetableGateway):
    def __init__(self):
        host = os.getenv("TIMETABLE_SERVICE_HOST", "timetable-engine")
        port = os.getenv("TIMETABLE_SERVICE_PORT", "50051")
        self.channel_url = f"{host}:{port}"

    def check_availability(self,start: datetime,end: datetime,existing_bookings: List[Tuple[str, str]]) -> bool:
        try:
            with grpc.insecure_channel(self.channel_url) as channel:
                stub = pb2_grpc.TimetableCheckerStub(channel)

                candidate = pb2.TimeRange(
                    start=ensure_utc(start).isoformat(),
                    end=ensure_utc(end).isoformat()
                )

                existing_protos = [
                    pb2.TimeRange(start=s, end=e) for (s, e) in existing_bookings
                ]

                request = pb2.CheckRequest(
                    candidate=candidate,
                    existing_bookings=existing_protos
                )

                response = stub.CheckAvailability(request)
                return not response.has_conflict

        except grpc.RpcError as e:
            raise TimetableUnavailableError("Timetable engine unavailable") from e
