import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.core.database import Base

class EstadoContrato(str, enum.Enum):
    pendiente = "pendiente"
    en_revision = "en_revision"
    aceptado = "aceptado"
    rechazado = "rechazado"

class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False, index=True)
    
    # --- DATOS GENERALES DE LA OPERACIÓN ---
    tipo_operacion = Column(String, nullable=False, default="renting") # 'renting' o 'importacion'
    estado = Column(SAEnum(EstadoContrato, name="estado_contrato", create_type=False), nullable=False, default=EstadoContrato.pendiente)
    margen_zenith = Column(Numeric(12, 2), nullable=False, default=0) 
    
    # --- EXCLUSIVO IMPORTACIÓN ---
    importe_total = Column(Numeric(12, 2), nullable=True) 

    # --- EXCLUSIVOS RENTING (Ahora son opcionales para no romper la importación) ---
    plazo_meses = Column(Integer, nullable=True)
    km_anuales = Column(Integer, nullable=True)
    aportacion_inicial = Column(Numeric(12, 2), nullable=True, default=0)
    valor_residual = Column(Numeric(12, 2), nullable=True)
    coste_mantenimiento = Column(Numeric(12, 2), nullable=True)
    coste_seguro = Column(Numeric(12, 2), nullable=True)
    base_imponible = Column(Numeric(12, 2), nullable=True)
    cuota_mensual = Column(Numeric(12, 2), nullable=True)
    total_contrato = Column(Numeric(12, 2), nullable=True)

    fecha_solicitud = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    usuario = relationship("Usuario", back_populates="contratos")
    vehiculo = relationship("Vehiculo", back_populates="contratos")