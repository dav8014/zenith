from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import get_settings

# Cargamos la configuración (lee el .env)
settings = get_settings()

# Creamos el motor de la conexion a PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

# Fabrica de sesiones 
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# Clase base para todos los modelos
class Base(DeclarativeBase):
    pass

# Generador de sesiones para los endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()