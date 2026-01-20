import os
import smtplib
from email.mime.multipart import MIMEMultipart

from email_sender import EmailSender


class FakeSMTP:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.sent_messages = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def send_message(self, msg):
        self.sent_messages.append(msg)


def test_send_booking_confirmation_success(monkeypatch):
    # Arrange
    os.environ["SMTP_HOST"] = "smtp-test"
    os.environ["SMTP_PORT"] = "2525"

    fake = {"instance": None}

    def fake_smtp(host, port):
        fake["instance"] = FakeSMTP(host, port)
        return fake["instance"]

    monkeypatch.setattr(smtplib, "SMTP", fake_smtp)

    sender = EmailSender()

    # Act
    ok = sender.send_booking_confirmation(
        to_email="user@test.com",
        booking_id="booking-123",
        status="CONFIRMED",
    )

    # Assert
    assert ok is True
    assert fake["instance"] is not None
    assert fake["instance"].host == "smtp-test"
    assert fake["instance"].port == 2525
    assert len(fake["instance"].sent_messages) == 1

    msg = fake["instance"].sent_messages[0]
    assert isinstance(msg, MIMEMultipart)
    assert msg["To"] == "user@test.com"
    assert msg["From"]



def test_send_booking_confirmation_returns_false_on_exception(monkeypatch):
    os.environ["SMTP_HOST"] = "smtp-test"
    os.environ["SMTP_PORT"] = "2525"

    class ExplodingSMTP:
        def __init__(self, host, port):
            raise RuntimeError("SMTP down")

    monkeypatch.setattr(smtplib, "SMTP", ExplodingSMTP)

    sender = EmailSender()
    ok = sender.send_booking_confirmation(
        to_email="user@test.com",
        booking_id="booking-123",
        status="CONFIRMED",
    )
    assert ok is False
