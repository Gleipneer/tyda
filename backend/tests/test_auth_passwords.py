"""Verifierar att lösenord hashas med bcrypt (salt ingår i hash-strängen)."""

from app.security import hash_password, verify_password


def test_hash_and_verify_roundtrip():
    plain = "exempellosenord123"
    h = hash_password(plain)
    assert h != plain
    assert verify_password(plain, h) is True
    assert verify_password("felaktigt", h) is False


def test_same_password_yields_different_hashes():
    """bcrypt ska generera olika hash vid olika salt (standardbeteende)."""
    plain = "sammaLosenord4567"
    a = hash_password(plain)
    b = hash_password(plain)
    assert a != b
    assert verify_password(plain, a) and verify_password(plain, b)


def test_empty_hash_verification_fails():
    assert verify_password("x", "") is False
