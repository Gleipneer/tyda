"""Pydantic-scheman för aktivitetslogg."""
from datetime import datetime
from pydantic import BaseModel


class ActivityRead(BaseModel):
    logg_id: int
    post_id: int
    anvandar_id: int
    handelse: str
    tidpunkt: datetime
