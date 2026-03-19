"""Kontrollera att demo-hashar i SQL stämmer med lösenord (kör: python scripts/verify_demo_password_hashes.py)."""
from app.security import verify_password

HASH_JOAKIM = "$2b$12$JsvVfxd4YURGKTxQhNzbW.Z8SZzWuQrk2AoIc4JcE0AyuMAR1pEr2"
HASH_ADMIN = "$2b$12$Bgbobq7Syp3FZIzfrnU5OOjTw76.W3BfU5wYkOHoLyIoxJ0wHBWIG"
HASH_DEMO = "$2b$12$w0ybC1ULTmPbKFxzdt9TruV6Bw7IPpApx5UNKMXwiewtvAiAARz4K"

assert verify_password("15Femton", HASH_JOAKIM)
assert verify_password("admin", HASH_ADMIN)
assert verify_password("demo123", HASH_DEMO)
print("OK: alla demo-hashar verifierades.")
