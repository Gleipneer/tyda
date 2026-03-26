"""Ett ställe för OpenAI Chat Completions-anrop i interpret-flödet (parametrar per modellfamilj)."""
from __future__ import annotations

from typing import Any

from app.services.interpret_models import uses_new_token_param

# GPT-5 drar reasoning tokens ur samma tak som synlig text; för lågt tak ⇒ tomt svar.
_GPT5_FAMILY_MAX_COMPLETION = 8192
_OTHER_REASONING_MAX_COMPLETION = 4096


def _max_completion_tokens(model: str) -> int:
    m = model.lower()
    if m.startswith("gpt-5"):
        return _GPT5_FAMILY_MAX_COMPLETION
    if m.startswith("o1") or m.startswith("o3") or m.startswith("o4"):
        return _OTHER_REASONING_MAX_COMPLETION
    return 1024


def create_interpret_chat_completion(client: Any, *, model: str, messages: list[dict[str, str]]) -> Any:
    """
    Anropar client.chat.completions.create med rätt parametrar.
    GPT-5 m.fl.: max_completion_tokens, ingen temperature (undviker Unsupported parameter).
    Övriga: max_tokens + temperature.
    """
    base: dict[str, Any] = {"model": model, "messages": messages}
    if uses_new_token_param(model):
        return client.chat.completions.create(**base, max_completion_tokens=_max_completion_tokens(model))
    return client.chat.completions.create(**base, max_tokens=700, temperature=0.2)
