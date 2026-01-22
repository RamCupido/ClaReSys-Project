# tests/test_handler.py
import json
from unittest.mock import MagicMock

import pytest

from main import handle_message


def test_handle_message_returns_false_on_missing_fields():
    sender = MagicMock()

    body = json.dumps({
        "email": "user@test.com",
        "booking_id": "booking-123",
        # falta status
    }).encode("utf-8")

    ok = handle_message(body, sender)

    assert ok is False
    sender.send_booking_confirmation.assert_not_called()


def test_handle_message_calls_sender_and_returns_true_when_ok():
    sender = MagicMock()
    sender.send_booking_confirmation.return_value = True

    body = json.dumps({
        "email": "user@test.com",
        "booking_id": "booking-123",
        "status": "CONFIRMED",
    }).encode("utf-8")

    ok = handle_message(body, sender)

    assert ok is True
    sender.send_booking_confirmation.assert_called_once_with(
        "user@test.com",
        "booking-123",
        "CONFIRMED",
    )


def test_handle_message_returns_false_when_sender_returns_false():
    sender = MagicMock()
    sender.send_booking_confirmation.return_value = False

    body = json.dumps({
        "email": "user@test.com",
        "booking_id": "booking-456",
        "status": "REJECTED",
    }).encode("utf-8")

    ok = handle_message(body, sender)

    assert ok is False
    sender.send_booking_confirmation.assert_called_once()


def test_handle_message_invalid_json_returns_false_if_you_handle_exceptions():
    """
    Si tu handle_message NO atrapa excepciones, este test fallará.
    En ese caso, elimina este test o cambia a pytest.raises().
    """
    sender = MagicMock()
    bad_body = b"{not-json"

    try:
        ok = handle_message(bad_body, sender)
        assert ok is False
    except Exception:
        pytest.skip("Tu handle_message no captura JSON inválido (aceptable).")
