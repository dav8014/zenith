from sqlalchemy.orm import Session

from app.models.vehiculo_imagen import VehiculoImagen
from app.schemas.vehiculo_imagen import VehiculoImagenCreate


def get_imagenes_vehiculo(db: Session, vehiculo_id: int) -> list[VehiculoImagen]:
    return (
        db.query(VehiculoImagen)
        .filter(VehiculoImagen.vehiculo_id == vehiculo_id)
        .order_by(VehiculoImagen.orden)
        .all()
    )


def add_imagen(db: Session, vehiculo_id: int, datos: VehiculoImagenCreate) -> VehiculoImagen:
    imagen = VehiculoImagen(vehiculo_id=vehiculo_id, imagen_url=datos.imagen_url, orden=datos.orden)
    db.add(imagen)
    db.commit()
    db.refresh(imagen)
    return imagen


def delete_imagen(db: Session, vehiculo_id: int, imagen_id: int) -> bool:
    imagen = (
        db.query(VehiculoImagen)
        .filter(VehiculoImagen.id == imagen_id, VehiculoImagen.vehiculo_id == vehiculo_id)
        .first()
    )
    if not imagen:
        return False
    db.delete(imagen)
    db.commit()
    return True
