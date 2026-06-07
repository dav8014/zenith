from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.vehiculo import Combustible, EstadoLogistico, OrigenVehiculo
from app.schemas.vehiculo_imagen import VehiculoImagenOut


class VehiculoBase(BaseModel):
    marca: str
    modelo: str
    anio: int = Field(..., ge=1900, le=2100)
    kilometraje: int = Field(default=0, ge=0)
    combustible: Combustible
    emisiones_co2: float | None = None
    color: str | None = None
    tipo_cambio: str | None = None
    potencia: int | None = None
    num_puertas: int | None = None
    precio_base: Decimal = Field(..., gt=0, decimal_places=2)
    coste_transporte: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    iedmt: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    origen: OrigenVehiculo
    plataforma_origen: str | None = None
    imagen_url: str | None = None
    descripcion: str | None = None


class VehiculoCreate(VehiculoBase):
    estado_logistico: EstadoLogistico = EstadoLogistico.disponible
    activo: bool = True


class VehiculoUpdate(BaseModel):
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = Field(default=None, ge=1900, le=2100)
    kilometraje: int | None = Field(default=None, ge=0)
    combustible: Combustible | None = None
    emisiones_co2: float | None = None
    color: str | None = None
    tipo_cambio: str | None = None
    potencia: int | None = None
    num_puertas: int | None = None
    precio_base: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    coste_transporte: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    iedmt: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    origen: OrigenVehiculo | None = None
    estado_logistico: EstadoLogistico | None = None
    imagen_url: str | None = None
    activo: bool | None = None


class VehiculoOut(VehiculoBase):
    id: int
    precio_final: Decimal
    estado_logistico: EstadoLogistico
    activo: bool
    imagenes: list[VehiculoImagenOut] = []

    model_config = ConfigDict(from_attributes=True)


class VehiculoETL(VehiculoBase):
    plataforma_origen: str  # requerido para ETL, sobreescribe el opcional de VehiculoBase
    id_anuncio_externo: str
    estado_logistico: EstadoLogistico = EstadoLogistico.disponible
    activo: bool = True
    margen_zenith: Decimal
    precio_final: Decimal