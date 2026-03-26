"""JWT skapande och validering (ingen nätverks-I/O)."""
import jwt

from app.jwt_tokens import create_access_token, decode_access_token


def test_create_and_decode_roundtrip():
    uid = 42
    token = create_access_token(uid)
    assert isinstance(token, str)
    assert decode_access_token(token) == uid


def test_decode_rejects_tampered_token():
    token = create_access_token(1)
    parts = token.split(".")
    assert len(parts) == 3
    bad = parts[0] + "." + parts[1] + ".xxx"
    try:
        decode_access_token(bad)
    except jwt.PyJWTError:
        return
    raise AssertionError("expected PyJWTError")
