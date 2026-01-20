import json
from unittest.mock import MagicMock
import os

import pytest

from user_client import UserClient
from main import handle_message


def test_user_client_requires_base_url(monkeypatch):
    monkeypatch.delenv("USER_SERVICE_BASE_URL", raising=False)
    with pytest.raises(RuntimeError):
        UserClient()


def test_handle_message_resolves_email_by_user_id(monkeypatch):
    monkeypatch.setenv("USER_SERVICE_BASE_URL", "http://user-service:8000/api/v1/users")

    sender = MagicMock()
    sender.send_booking_confirmation.return_value = True

    import main as main_module
    fake_client = MagicMock()
    fake_client.get_email_by_user_id.return_value = "resolved@test.com"
    main_module.user_client = fake_client

    body = json.dumps({
        "booking_id": "B-1",
        "user_id": "11111111-1111-1111-1111-111111111111",
        "status": "CONFIRMED"
    }).encode("utf-8")

    ok = handle_message(body, sender)

    assert ok is True
    fake_client.get_email_by_user_id.assert_called_once()
    sender.send_booking_confirmation.assert_called_once_with("resolved@test.com", "B-1", "CONFIRMED")
