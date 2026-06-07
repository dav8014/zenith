from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class VehiculoImagen(Base):
    __tablename__ = "vehiculo_imagenes"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    imagen_url = Column(String(500), nullable=False)
    orden = Column(Integer, nullable=False, default=0)

    vehiculo = relationship("Vehiculo", back_populates="imagenes")
