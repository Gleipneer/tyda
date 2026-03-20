"""Kontraktstest för whitelistade databasfrågor (ingen DB)."""

from app.routers import admin_database_queries


def test_database_queries_whitelist_nonempty_and_unique_ids():
    ids = [q["id"] for q in admin_database_queries._PREDEFINED_DATABASE_QUERIES]
    assert len(ids) == len(set(ids))
    assert len(ids) >= 10


def test_database_queries_cover_sql_principles():
    principles = " ".join(q["principle"] for q in admin_database_queries._PREDEFINED_DATABASE_QUERIES).lower()
    assert "where" in principles
    assert "order by" in principles
    assert "inner join" in principles
    assert "left join" in principles
    assert "group by" in principles
    assert "having" in principles
    assert "call" in principles


def test_only_select_and_call_kinds():
    for q in admin_database_queries._PREDEFINED_DATABASE_QUERIES:
        assert q["kind"] in ("select", "call")
        assert q["sql"].strip()
        assert not q["sql"].strip().lower().startswith(("insert", "update", "delete", "drop", "alter", "truncate"))
