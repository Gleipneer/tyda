"""Visa index på PostBegrepp."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mysql.connector
from app.config import settings

conn = mysql.connector.connect(
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
    user=settings.DB_USER,
    password=settings.DB_PASSWORD,
)
cur = conn.cursor()
cur.execute("SHOW INDEX FROM PostBegrepp")
rows = cur.fetchall()
# Table, Non_unique, Key_name, Seq_in_index, Column_name, ...
print("Indexnamn                          | Kolumn      | Unik")
print("-" * 55)
for r in rows:
    unik = "Ja" if r[1] == 0 else "Nej"
    print(f"{r[2]:35} | {r[4]:11} | {unik}")
cur.close()
conn.close()
