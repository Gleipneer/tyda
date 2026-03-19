"""Lösenord: bcrypt via passlib (fasta rundor för deterministisk kostnad)."""
from passlib.hash import bcrypt


def hash_password(plain: str) -> str:
    return bcrypt.using(rounds=12).hash(plain)


def verify_password(plain: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    return bcrypt.verify(plain, password_hash)
