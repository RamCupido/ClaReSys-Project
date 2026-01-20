import json

from main import handle_message


class FakeEmailSender:
    def __init__(self):
        self.calls = []

    def send_booking_confirmation(self, email, booking_id, status):
        self.calls.append((email, booking_id, status))
        return True


def test_handle_message_calls_email_sender():
    sender = FakeEmailSender()

    body = json.dumps({
        "email": "user@test.com",
        "booking_id": "booking-123",
        "status": "CONFIRMED"
    }).encode("utf-8")

    ok = handle_message(body, sender)

    assert ok is True
    assert sender.calls == [("user@test.com", "booking-123", "CONFIRMED")]


def test_handle_message_returns_false_on_missing_fields():
    sender = FakeEmailSender()

    body = json.dumps({
        "email": "user@test.com",
        "booking_id": "booking-123"
        # falta status
    }).encode("utf-8")

    ok = handle_message(body, sender)

    assert ok is False
    assert sender.calls == []
