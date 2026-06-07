from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.usuario import Usuario
from app.schemas.vehiculo import VehiculoCreate, VehiculoOut, VehiculoUpdate
from app.schemas.vehiculo_imagen import VehiculoImagenCreate, VehiculoImagenOut
from app.schemas.contrato import RentingSimulacion, RentingSimulacionOut
from app.services import vehiculo_service
from app.services import vehiculo_imagen_service
from app.services import contrato_service

router = APIRouter(prefix="/vehiculos", tags=["Catálogo de vehículos"])


@router.get("", response_model=list[VehiculoOut], summary="Listar todos los vehículos (admin)",
    description="Devuelve todos los vehículos activos, nacionales e importados. Solo administradores.")
def listar_vehiculos(db: Session = Depends(get_db), _admin: Usuario = Depends(get_current_admin)):
    return vehiculo_service.listar_vehiculos(db, activo=True)


@router.get("/nacionales", response_model=list[VehiculoOut], summary="Catálogo de renting",
    description="Devuelve todos los vehículos activos de origen nacional.")
def listar_nacionales(db: Session = Depends(get_db)):
    return vehiculo_service.listar_vehiculos_nacionales(db)


@router.get("/importados", response_model=list[VehiculoOut], summary="Vehículos importados",
    description="Devuelve todos los vehículos activos de origen importado.")
def listar_importados(db: Session = Depends(get_db)):
    return vehiculo_service.listar_vehiculos_importados(db)


@router.get("/{vehiculo_id}", response_model=VehiculoOut, summary="Ver ficha de vehículo",
    description="Devuelve el detalle completo de un vehículo a partir de su ID.")
def obtener_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    vehiculo = vehiculo_service.obtener_vehiculo_por_id(db, vehiculo_id)
    if not vehiculo or not vehiculo.activo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehiculo


@router.post("", response_model=VehiculoOut, status_code=status.HTTP_201_CREATED, summary="Registrar vehículo",
    description="Añade un nuevo vehículo al inventario. Solo administradores.")
def crear_vehiculo(datos: VehiculoCreate, db: Session = Depends(get_db), _admin: Usuario = Depends(get_current_admin)):
    return vehiculo_service.crear_vehiculo(db, datos)


@router.patch("/{vehiculo_id}", response_model=VehiculoOut, summary="Actualizar datos del vehículo",
    description="Modifica los campos indicados de un vehículo existente. Solo administradores.")
def actualizar_vehiculo(vehiculo_id: int, datos: VehiculoUpdate, db: Session = Depends(get_db), _admin: Usuario = Depends(get_current_admin)):
    vehiculo = vehiculo_service.actualizar_vehiculo(db, vehiculo_id, datos)
    if not vehiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehiculo


@router.delete("/{vehiculo_id}", status_code=status.HTTP_200_OK, summary="Dar de baja vehículo",
    description="Marca el vehículo como inactivo. Deja de aparecer en el catálogo pero conserva su historial.")
def desactivar_vehiculo(vehiculo_id: int, db: Session = Depends(get_db), _admin: Usuario = Depends(get_current_admin)):
    if not vehiculo_service.desactivar_vehiculo(db, vehiculo_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return {"detail": "Vehículo inactivo"}


@router.get("/{vehiculo_id}/imagenes", response_model=list[VehiculoImagenOut], summary="Galería de imágenes",
    description="Devuelve todas las imágenes del vehículo ordenadas por campo orden.")
def listar_imagenes(vehiculo_id: int, db: Session = Depends(get_db)):
    vehiculo = vehiculo_service.obtener_vehiculo_por_id(db, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehiculo_imagen_service.get_imagenes_vehiculo(db, vehiculo_id)


@router.post("/{vehiculo_id}/imagenes", response_model=VehiculoImagenOut, status_code=status.HTTP_201_CREATED,
    summary="Añadir imagen", description="Añade una imagen a la galería del vehículo. Solo administradores.")
def añadir_imagen(vehiculo_id: int, datos: VehiculoImagenCreate, db: Session = Depends(get_db), _admin: Usuario = Depends(get_current_admin)):
    vehiculo = vehiculo_service.obtener_vehiculo_por_id(db, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehiculo_imagen_service.add_imagen(db, vehiculo_id, datos)


@router.delete("/{vehiculo_id}/imagenes/{imagen_id}", status_code=status.HTTP_200_OK,
    summary="Eliminar imagen", description="Elimina una imagen de la galería del vehículo. Solo administradores.")
def eliminar_imagen(vehiculo_id: int, imagen_id: int, db: Session = Depends(get_db), _admin: Usuario = Depends(get_current_admin)):
    if not vehiculo_imagen_service.delete_imagen(db, vehiculo_id, imagen_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imagen no encontrada")
    return {"detail": "Imagen eliminada"}


@router.post("/{vehiculo_id}/simular-renting", response_model=RentingSimulacionOut,
    summary="Simular cuota de renting",
    description="Calcula la cuota mensual y desglose financiero sin crear contrato. No requiere autenticación.")
def simular_renting(vehiculo_id: int, datos: RentingSimulacion, db: Session = Depends(get_db)):
    vehiculo = vehiculo_service.obtener_vehiculo_por_id(db, vehiculo_id)
    if not vehiculo or not vehiculo.activo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return contrato_service.calcular_renting(
        vehiculo.precio_final,
        datos.plazo_meses,
        datos.km_anuales,
        datos.aportacion_inicial,
    )