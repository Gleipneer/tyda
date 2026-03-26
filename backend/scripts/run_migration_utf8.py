"""
Kör migration med korrekt UTF-8.
Root cause: mysql CLI på Windows använder cp850, vilket korrupterar åäö vid pipning.
Lösning: Kör SQL via mysql-connector-python med charset=utf8mb4.

Logiken ligger i app.migrations_runner (samma kedja som vid backend-start).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.migrations_runner import run_all_migrations  # noqa: E402


def main() -> None:
    run_all_migrations(emit=True)


if __name__ == "__main__":
    main()
