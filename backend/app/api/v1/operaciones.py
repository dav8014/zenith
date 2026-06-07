from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from decimal import Decimal
from sqlalchemy.orm import Session

# 1. Tu base de datos REAL está aquí:
from app.core.database import get_db 

# 2. Tu modelo de vehículos:
from app.models.vehiculo import Vehiculo 

# 3. EL CONTRATO: Como seguramente no tienes operacion.py, vamos a usar el que ya tienes.
from app.models.contrato import Contrato as Operacion

router = APIRouter(prefix="/operaciones", tags=["Operaciones"])

# El esquema de entrada (Lo que React enviará por JSON)
class OperacionCreate(BaseModel):
    vehiculo_id: int
    usuario_id: int
    tipo_operacion: str
    importe_total: Decimal
    margen_zenith: Decimal

@router.post("/", status_code=201)
def crear_operacion(op: OperacionCreate, db: Session = Depends(get_db)):
    # 1. Verificar el coche
    coche = db.query(Vehiculo).filter(Vehiculo.id == op.vehiculo_id).first()
    if not coche:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if coche.estado_logistico != 'disponible':
        raise HTTPException(status_code=400, detail="El vehículo ya no está disponible")

    # 2. Registrar el contrato
    nueva_operacion = Operacion(
        usuario_id=op.usuario_id,
        vehiculo_id=op.vehiculo_id,
        tipo_operacion=op.tipo_operacion,
        importe_total=op.importe_total,
        margen_zenith=op.margen_zenith,
        estado='pendiente'
    )
    
    # 3. Bloquear el coche
    coche.estado_logistico = 'reservado'
    
    db.add(nueva_operacion)
    db.commit()
    db.refresh(nueva_operacion)
    
    return {"mensaje": "Reserva creada con éxito", "operacion_id": nueva_operacion.id}