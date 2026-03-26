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
    OPENAI_MODEL: str = "gpt-4.1-mini"  # default när klienten inte väljer modell; måste finnas i katalogen (ev. allowlist)
    # Valfritt: kommaseparerade modell-id:n som får erbjudas och anropas (t.ex. "gpt-5-mini,gpt-4.1-mini"). Tom = alla i katalogen.
    OPENAI_MODEL_ALLOWLIST: str = ""

    # JWT (Bearer) – byt till stark slump i produktion, t.ex. openssl rand -hex 32
    JWT_SECRET: str = "tyda-dev-jwt-secret-bytes-i-produktion"
    JWT_EXPIRE_HOURS: int = 168

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
