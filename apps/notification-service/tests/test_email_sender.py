# tests/test_email_sender.py
import pytest
from unittest.mock import MagicMock

import smtplib
from email_sender import EmailSender


def set_required_env(monkeypatch, *, host="smtp.test.com", port="587", user="user", password="pass", from_email="no-reply@test.com", from_name="ClaReSys"):
    monkeypatch.setenv("SMTP_HOST", host)
    monkeypatch.setenv("SMTP_PORT", str(port))
    monkeypatch.setenv("SMTP_USER", user)
    monkeypatch.setenv("SMTP_PASSWORD", password)
    monkeypatch.setenv("FROM_EMAIL", from_email)
    monkeypatch.setenv("FROM_NAME", from_name)


def test_email_sender_requires_env(monkeypatch):
    # Limpia variables requeridas
    for k in ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "FROM_EMAIL"]:
        monkeypatch.delenv(k, raising=False)

    with pytest.raises(RuntimeError):
        EmailSender()


def test_send_booking_confirmation_uses_starttls_on_587(monkeypatch):
    # Arrange
    set_required_env(monkeypatch, port="587")
    monkeypatch.setenv("SMTP_USE_TLS", "true")
    monkeypatch.setenv("SMTP_USE_SSL", "false")

    smtp_instance = MagicMock()
    monkeypatch.setattr(smtplib, "SMTP", MagicMock(return_value=smtp_instance))

    sender = EmailSender()

    # Act
    ok = sender.send_booking_confirmation(
        to_email="destino@test.com",
        booking_id="booking-123",
        status="CONFIRMED",
    )

    # Assert
    assert ok is True
    smtplib.SMTP.assert_called_once_with("smtp.test.com", 587, timeout=20)
    smtp_instance.ehlo.assert_called()
    smtp_instance.starttls.assert_called_once()
    smtp_instance.login.assert_called_once_with("user", "pass")
    smtp_instance.send_message.assert_called_once()
    smtp_instance.quit.assert_called_once()


def test_send_booking_confirmation_uses_ssl_on_465(monkeypatch):
    # Arrange
    set_required_env(monkeypatch, port="465")
    # Forzamos SSL explícito
    monkeypatch.setenv("SMTP_USE_SSL", "true")
    monkeypatch.setenv("SMTP_USE_TLS", "false")

    ssl_instance = MagicMock()
    monkeypatch.setattr(smtplib, "SMTP_SSL", MagicMock(return_value=ssl_instance))

    sender = EmailSender()

    # Act
    ok = sender.send_booking_confirmation(
        to_email="destino@test.com",
        booking_id="booking-999",
        status="CONFIRMED",
    )

    # Assert
    assert ok is True
    smtplib.SMTP_SSL.assert_called_once_with("smtp.test.com", 465, timeout=20)
    ssl_instance.starttls.assert_not_called()
    ssl_instance.login.assert_called_once_with("user", "pass")
    ssl_instance.send_message.assert_called_once()
    ssl_instance.quit.assert_called_once()


def test_send_booking_confirmation_returns_false_when_smtp_fails(monkeypatch):
    # Arrange
    set_required_env(monkeypatch, port="587")
    monkeypatch.setenv("SMTP_USE_TLS", "true")
    monkeypatch.setenv("SMTP_USE_SSL", "false")

    class ExplodingSMTP:
        def __init__(self, *args, **kwargs):
            raise RuntimeError("SMTP down")

    monkeypatch.setattr(smtplib, "SMTP", ExplodingSMTP)

    sender = EmailSender()

    # Act
    ok = sender.send_booking_confirmation(
        to_email="destino@test.com",
        booking_id="booking-err",
        status="CONFIRMED",
    )

    # Assert
    assert ok is False
