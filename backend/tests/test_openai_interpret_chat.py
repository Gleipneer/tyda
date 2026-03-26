"""Verifierar att rätt parametrar skickas till OpenAI beroende på modellfamilj."""
from unittest.mock import MagicMock

from app.services.openai_interpret_chat import create_interpret_chat_completion


def test_gpt41_uses_max_tokens_and_temperature():
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock()
    create_interpret_chat_completion(
        client,
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": "x"}],
    )
    client.chat.completions.create.assert_called_once()
    kw = client.chat.completions.create.call_args.kwargs
    assert kw["model"] == "gpt-4.1-mini"
    assert kw["max_tokens"] == 700
    assert kw["temperature"] == 0.2
    assert "max_completion_tokens" not in kw


def test_gpt5_uses_max_completion_tokens_no_temperature():
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock()
    create_interpret_chat_completion(
        client,
        model="gpt-5",
        messages=[{"role": "user", "content": "x"}],
    )
    kw = client.chat.completions.create.call_args.kwargs
    assert kw["model"] == "gpt-5"
    assert kw["max_completion_tokens"] == 8192
    assert "max_tokens" not in kw
    assert "temperature" not in kw


def test_gpt5_mini_same_family():
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock()
    create_interpret_chat_completion(
        client,
        model="gpt-5-mini",
        messages=[{"role": "user", "content": "x"}],
    )
    kw = client.chat.completions.create.call_args.kwargs
    assert "max_completion_tokens" in kw
    assert "temperature" not in kw
