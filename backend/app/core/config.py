from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pydantic import field_validator

class Settings(BaseSettings):
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore", 
    )
    
    # Base de datos
    DATABASE_URL: str
    
    # Seguridad (JWT)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Proyecto
    PROJECT_NAME: str = "Zenith API"
    API_VERSION: str = "v1"
    API_PREFIX: str = "/api/v1"
    
    # Negocio
    INTERES_ANUAL_DEFAULT: float = 5.5  # porcentaje anual aplicado a nuevos contratos

    # CORS
    CORS_ORIGINS: list[str] = ["https://localhost:5173"]

    # Validacion
    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str) :
            return v.split(",")
        return v
    
    
@lru_cache
def get_settings() -> Settings:
    return Settings()
