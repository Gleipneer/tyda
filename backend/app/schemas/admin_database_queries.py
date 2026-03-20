"""Schema för admin: fördefinierade databasfrågor (read-only, whitelist)."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class DatabaseQueryCatalogItem(BaseModel):
    """Metadata för en fördefinierad fråga (ingen exekvering i listan)."""

    id: str
    title: str
    description: str
    principle: str = Field(
        description="Vilket SQL-koncept som demonstreras, t.ex. INNER JOIN, GROUP BY, HAVING, CALL"
    )
    sql_text: str = Field(description="Exakt SQL som körs (för pedagogik och transparens)")


class DatabaseQueryRunResponse(BaseModel):
    """Resultat från en whitelistad fråga."""

    query_id: str
    title: str
    sql_executed: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    kind: Literal["select", "call"] = "select"
