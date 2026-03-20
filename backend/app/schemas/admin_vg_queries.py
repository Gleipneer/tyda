"""Schema för admin VG-queryvisning (read-only, whitelist)."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class VgQueryCatalogItem(BaseModel):
    """Metadata för en fördefinierad query (ingen exekvering i listan)."""

    id: str
    title: str
    description: str
    principle: str = Field(
        description="Vilket SQL-koncept som demonstreras, t.ex. INNER JOIN, GROUP BY, HAVING, CALL"
    )
    sql_text: str = Field(description="Exakt SQL som körs (för pedagogik och transparens)")


class VgQueryExecuteResponse(BaseModel):
    """Resultat från en whitelistad query."""

    query_id: str
    title: str
    sql_executed: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    kind: Literal["select", "call"] = "select"
