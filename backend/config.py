"""
CyberShield AI - FastAPI Backend Configuration
Environment variables and settings management
"""
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "CyberShield AI"
    app_version: str = "1.0.0"
    debug: bool = False
    demo_mode: bool = True  # Enable demo mode for hackathon
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Database (Supabase PostgreSQL)
    # Format: postgresql+asyncpg://user:password@host:port/database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./cybershield.db",
        description="Database connection URL. Use postgresql+asyncpg:// for Supabase"
    )
    
    # Supabase specific settings
    supabase_url: str = Field(default="", description="Supabase project URL")
    supabase_anon_key: str = Field(default="", description="Supabase anonymous/public key")
    supabase_service_role_key: str = Field(default="", description="Supabase service role key (server-side only)")
    
    # Security
    secret_key: str = Field(default="cybershield-secret-key-change-in-production-32chars")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API Keys
    api_key: str = Field(default="cybershield-api-key")
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # AI Model Settings
    model_confidence_threshold: float = 0.5
    max_content_length: int = 50000  # Max chars to analyze
    
    # Privacy Settings
    retention_days: int = 30
    anonymize_data: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()
