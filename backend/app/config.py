"""
Konfiguration för Reflektionsarkiv backend.
Läser från miljövariabler via pydantic-settings.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Databas- och appkonfiguration från miljövariabler."""

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "reflektionsarkiv"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # OpenAI (valfritt – AI-tolkning)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4.1-mini"  # gpt-4.1-mini | gpt-4.1 | gpt-4o | gpt-5-mini | gpt-5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
