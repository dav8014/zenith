import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SAEnum, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class RolUsuario(str, enum.Enum):
    admin = "admin"
    cliente = "cliente"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellidos = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(SAEnum(RolUsuario, name="rol_usuario", create_type=False), nullable=False, default=RolUsuario.cliente)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    contratos = relationship("Contrato", back_populates="usuario", cascade="all, delete-orphan")
