import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Numeric
from sqlalchemy import (
    Boolean, Column, DateTime, Enum as SAEnum,
    Float, Integer, Numeric, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Combustible(str, enum.Enum):
    gasolina = "gasolina"
    diesel = "diesel"
    electrico = "electrico"
    hibrido = "hibrido"
    hibrido_enchufable = "hibrido_enchufable"


class OrigenVehiculo(str, enum.Enum):
    nacional = "nacional"
    importado = "importado"


class EstadoLogistico(str, enum.Enum):
    disponible = "disponible"
    reservado = "reservado"
    en_transito = "en_transito"
    entregado = "entregado"


class Vehiculo(Base):
    __tablename__ = "vehiculos"
    __table_args__ = (
        UniqueConstraint("plataforma_origen", "id_anuncio_externo", name="uq_vehiculo_externo"),
    )

    id = Column(Integer, primary_key=True, index=True)
    marca = Column(String(100), nullable=False, index=True)
    modelo = Column(String(100), nullable=False)
    anio = Column(Integer, nullable=False)
    kilometraje = Column(Integer, nullable=False, default=0)
    combustible = Column(SAEnum(Combustible, name="combustible", create_type=False), nullable=False)
    emisiones_co2 = Column(Float, nullable=True)
    color = Column(String(50), nullable=True)
    tipo_cambio = Column(String(20), nullable=True)
    potencia = Column(Integer, nullable=True)
    num_puertas = Column(Integer, nullable=True)
    precio_base = Column(Numeric(12, 2), nullable=False)
    coste_transporte = Column(Numeric(12, 2), nullable=False, default=0)
    iedmt = Column(Numeric(12, 2), nullable=False, default=0)
    margen_zenith = Column(Numeric(12, 2), nullable=False, default=0)
    
    precio_final = Column(Numeric(12, 2), nullable=False)
    origen = Column(SAEnum(OrigenVehiculo, name="origen_vehiculo", create_type=False), nullable=False)
    estado_logistico = Column(
        SAEnum(EstadoLogistico, name="estado_logistico", create_type=False),
        nullable=False,
        default=EstadoLogistico.disponible,
    )
    plataforma_origen = Column(String(100), nullable=True)
    id_anuncio_externo = Column(String(100), nullable=True)
    imagen_url = Column(String(500), nullable=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    contratos = relationship("Contrato", back_populates="vehiculo")
    imagenes = relationship("VehiculoImagen", back_populates="vehiculo", cascade="all, delete-orphan", order_by="VehiculoImagen.orden")
