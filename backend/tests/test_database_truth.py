from app.db import get_connection


def _fetchall(sql: str):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def test_core_tables_exist():
    rows = _fetchall(
        """
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
        """
    )
    assert [row["TABLE_NAME"] for row in rows] == [
        "aktivitetlogg",
        "anvandare",
        "begrepp",
        "kategorier",
        "postbegrepp",
        "poster",
    ]


def test_redundant_unique_shadow_indexes_are_gone():
    rows = _fetchall(
        """
        SELECT TABLE_NAME, INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND INDEX_NAME IN ('idx_anvandare_epost', 'idx_begrepp_ord')
        ORDER BY TABLE_NAME, INDEX_NAME
        """
    )
    assert rows == []


def test_activity_indexes_exist_for_runtime_queries():
    rows = _fetchall(
        """
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'aktivitetlogg'
          AND INDEX_NAME IN ('idx_aktivitetlogg_post_tidpunkt')
        GROUP BY INDEX_NAME
        ORDER BY INDEX_NAME
        """
    )
    assert [row["INDEX_NAME"] for row in rows] == ["idx_aktivitetlogg_post_tidpunkt"]


def test_delete_rules_are_explicit_for_post_children():
    rows = _fetchall(
        """
        SELECT CONSTRAINT_NAME, DELETE_RULE
        FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME IN ('postbegrepp_ibfk_1', 'postbegrepp_ibfk_2', 'aktivitetlogg_ibfk_1')
        ORDER BY CONSTRAINT_NAME
        """
    )
    assert rows == [
        {"CONSTRAINT_NAME": "aktivitetlogg_ibfk_1", "DELETE_RULE": "CASCADE"},
        {"CONSTRAINT_NAME": "postbegrepp_ibfk_1", "DELETE_RULE": "CASCADE"},
        {"CONSTRAINT_NAME": "postbegrepp_ibfk_2", "DELETE_RULE": "CASCADE"},
    ]


def test_trigger_and_procedure_still_exist():
    triggers = _fetchall(
        """
        SELECT TRIGGER_NAME
        FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
        """
    )
    routines = _fetchall(
        """
        SELECT ROUTINE_NAME
        FROM information_schema.ROUTINES
        WHERE ROUTINE_SCHEMA = DATABASE()
          AND ROUTINE_TYPE = 'PROCEDURE'
        """
    )
    assert triggers == [{"TRIGGER_NAME": "trigga_ny_post_logg"}]
    assert routines == [{"ROUTINE_NAME": "hamta_poster_per_kategori"}]
