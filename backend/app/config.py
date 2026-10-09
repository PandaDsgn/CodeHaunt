from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://codehaunt:codehaunt@localhost:5432/codehaunt"
    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 12

    grok_api_keys: str = ""
    grok_model: str = "grok-code-fast-1"

    @property
    def grok_keys(self) -> list[str]:
        return [k.strip() for k in self.grok_api_keys.split(",") if k.strip()]


settings = Settings()
