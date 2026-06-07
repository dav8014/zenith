from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.contrato import EstadoContrato
from app.schemas.usuario import UsuarioOut
from app.schemas.vehiculo import VehiculoOut


class ContratoCreate(BaseModel):
    vehiculo_id: int
    plazo_meses: int = Field(..., ge=36, le=60)
    km_anuales: int = Field(..., ge=10000, le=20000)
    aportacion_inicial: Decimal = Field(default=Decimal("0"), ge=0)
    cuota_mensual_fijada: Decimal


class ContratoUpdate(BaseModel):
    estado: EstadoContrato


class ContratoOut(BaseModel):
    id: int
    usuario_id: int
    vehiculo_id: int
    plazo_meses: int
    km_anuales: int
    aportacion_inicial: Decimal
    valor_residual: Decimal
    coste_mantenimiento: Decimal
    coste_seguro: Decimal
    margen_zenith: Decimal
    base_imponible: Decimal
    cuota_mensual: Decimal
    total_contrato: Decimal
    estado: EstadoContrato
    fecha_solicitud: datetime

    model_config = ConfigDict(from_attributes=True)


class ContratoDetalle(ContratoOut):
    usuario: UsuarioOut
    vehiculo: VehiculoOut


class RentingSimulacion(BaseModel):
    plazo_meses: int = Field(..., ge=36, le=60)
    km_anuales: int = Field(..., ge=10000, le=20000)
    aportacion_inicial: Decimal = Field(default=Decimal("0"), ge=0)


class RentingSimulacionOut(BaseModel):
    cuota_mensual: Decimal
    valor_residual: Decimal
    depreciacion: Decimal
    costes_operativos: Decimal
    margen_zenith: Decimal
    total_contrato: Decimal
    a_pagar: Decimal
