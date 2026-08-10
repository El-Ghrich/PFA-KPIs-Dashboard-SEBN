from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import re

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str
    VERSION: str
    API_V1_STR: str

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "kpi_user"
    POSTGRES_PASSWORD: str = "SecurePassword123"
    POSTGRES_DB: str = "kpi_dashboard"
    POSTGRES_PORT: str = "5433"

    DATABASE_URL: str | None = None

    JWT_SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip().strip("'").strip('"')
            # Convert driver prefix for asyncpg
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgres+asyncpg://", 1)

            # Strip query params like sslmode/channel_binding because asyncpg takes ssl in connect_args
            url = re.sub(r'[&?]sslmode=[^&]*', '', url)
            url = re.sub(r'[&?]channel_binding=[^&]*', '', url)
            return url

        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()