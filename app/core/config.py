from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)
    PROJECT_NAME: str = "Léxico API"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    LOG_LEVEL: str = "INFO"


settings = Settings()
