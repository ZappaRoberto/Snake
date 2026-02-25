"""Configuration settings for 3D Snake Game."""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = {"env_prefix": "SNAKE_"}

    # Game configuration
    grid_size: int = Field(default=20, ge=10, le=50)
    initial_snake_length: int = Field(default=3, ge=1, le=10)
    game_speed_ms: int = Field(default=100, ge=50, le=500)

    # Difficulty scaling configuration
    speed_reduction_per_apple: int = Field(default=8, ge=1, le=20)
    min_speed_ms: int = Field(default=60, ge=30, le=150)

    # Server configuration
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000, ge=1, le=65535)
    debug: bool = Field(default=False)

    # CORS configuration
    cors_origins: list[str] = Field(default=["http://localhost:5173", "http://localhost:3000"])


settings = Settings()
