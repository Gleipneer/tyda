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


def test_postbegrepp_has_no_relationtyp():
    """RelationTyp har tagits bort från PostBegrepp (migration 010)."""
    rows = _fetchall(
        """
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'postbegrepp'
        ORDER BY ORDINAL_POSITION
        """
    )
    columns = [r["COLUMN_NAME"] for r in rows]
    assert "RelationTyp" not in columns
    assert "Kommentar" not in columns
    assert "PostBegreppID" in columns
    assert "PostID" in columns
    assert "BegreppID" in columns


def test_postbegrepp_unique_on_postid_begreppid():
    """PostBegrepp har UNIQUE (PostID, BegreppID) efter migration 010."""
    rows = _fetchall(
        """
        SELECT INDEX_NAME, COLUMN_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'postbegrepp'
          AND INDEX_NAME = 'postbegrepp_postid_begreppid_unique'
        ORDER BY SEQ_IN_INDEX
        """
    )
    cols = [r["COLUMN_NAME"] for r in rows]
    assert cols == ["PostID", "BegreppID"]


def test_postbegrepp_no_redundant_post_index():
    """idx_postbegrepp_post är borttagen (migration 012), UNIQUE täcker PostID."""
    rows = _fetchall(
        """
        SELECT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'postbegrepp'
        GROUP BY INDEX_NAME
        """
    )
    names = [r["INDEX_NAME"] for r in rows]
    assert "idx_postbegrepp_post" not in names
    assert "idx_postbegrepp_begrepp" in names


def test_poster_synlighet_enum_privat_publik():
    """Poster.Synlighet är ENUM('privat','publik') efter migration 013."""
    rows = _fetchall(
        """
        SELECT COLUMN_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'poster'
          AND COLUMN_NAME = 'Synlighet'
        """
    )
    assert len(rows) == 1
    col_type = rows[0]["COLUMN_TYPE"].upper()
    assert "DELAD" not in col_type
    assert "PRIVAT" in col_type
    assert "PUBLIK" in col_type


def test_poster_has_check_titel():
    """Poster har CHECK-constraint för icke-tom titel (migration 014)."""
    rows = _fetchall(
        """
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'poster'
          AND CONSTRAINT_TYPE = 'CHECK'
          AND CONSTRAINT_NAME = 'chk_poster_titel_nonempty'
        """
    )
    assert len(rows) >= 1


def test_anvandare_has_auth_columns():
    """Anvandare har LosenordHash och ArAdmin (migration 015 / reflektionsarkiv.sql)."""
    rows = _fetchall(
        """
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND LOWER(TABLE_NAME) = 'anvandare'
        """
    )
    names = {r["COLUMN_NAME"].lower() for r in rows}
    assert "losenordhash" in names, (
        "Anvandare saknar LosenordHash (och troligen ArAdmin). "
        "Kör från backend-mappen: python scripts/run_migration_utf8.py "
        "eller importera om senaste reflektionsarkiv.sql."
    )
    assert "aradmin" in names


def test_trigger_and_procedure_still_exist():
    triggers = _fetchall(
        """
        SELECT TRIGGER_NAME
        FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
        ORDER BY TRIGGER_NAME
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
    names = [t["TRIGGER_NAME"] for t in triggers]
    assert names == ["trigga_ny_post_logg", "trigga_post_uppdaterad_logg"]
    assert routines == [{"ROUTINE_NAME": "hamta_poster_per_kategori"}]


def test_update_post_creates_activity_log_row():
    """trigga_post_uppdaterad_logg lägger en rad vid ändring av titel (migration 016)."""
    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT PostID, Titel FROM Poster LIMIT 1")
        row = cur.fetchone()
        assert row is not None
        pid, titel = row["PostID"], row["Titel"]
        cur.execute(
            """
            SELECT COUNT(*) AS c FROM AktivitetLogg
            WHERE PostID = %s AND Handelse = 'Post uppdaterad'
            """,
            (pid,),
        )
        before = cur.fetchone()["c"]
        cur.execute(
            "UPDATE Poster SET Titel = %s WHERE PostID = %s",
            (titel + " _tmp_pytest_", pid),
        )
        cur.execute(
            """
            SELECT COUNT(*) AS c FROM AktivitetLogg
            WHERE PostID = %s AND Handelse = 'Post uppdaterad'
            """,
            (pid,),
        )
        after = cur.fetchone()["c"]
        assert after == before + 1
        conn.rollback()
    finally:
        cur.close()
        conn.close()
