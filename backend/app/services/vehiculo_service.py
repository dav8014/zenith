from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoETL, VehiculoUpdate


def _precio_final(precio_base: Decimal, coste_transporte: Decimal, iedmt: Decimal) -> Decimal:
    return (precio_base + coste_transporte + iedmt).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def crear_vehiculo(db: Session, datos: VehiculoCreate) -> Vehiculo:
    datos_dict = datos.model_dump()
    datos_dict["precio_final"] = _precio_final(datos.precio_base, datos.coste_transporte, datos.iedmt)
    vehiculo = Vehiculo(**datos_dict)
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


def obtener_vehiculo_por_id(db: Session, vehiculo_id: int) -> Vehiculo | None:
    return db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()


def listar_vehiculos(db: Session, activo: bool = True) -> list[Vehiculo]:
    return db.query(Vehiculo).filter(Vehiculo.activo == activo).all()


def listar_vehiculos_nacionales(db: Session) -> list[Vehiculo]:
    return db.query(Vehiculo).filter(Vehiculo.origen == "nacional", Vehiculo.activo == True).all()


def listar_vehiculos_importados(db: Session) -> list[Vehiculo]:
    return db.query(Vehiculo).filter(Vehiculo.origen == "importado", Vehiculo.activo == True).all()


def actualizar_vehiculo(db: Session, vehiculo_id: int, datos: VehiculoUpdate) -> Vehiculo | None:
    vehiculo = obtener_vehiculo_por_id(db, vehiculo_id)
    if not vehiculo:
        return None
    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(vehiculo, campo, valor)
    # Recalcular precio_final si cambió algún componente de precio
    if {"precio_base", "coste_transporte", "iedmt"} & cambios.keys():
        vehiculo.precio_final = _precio_final(
            vehiculo.precio_base, vehiculo.coste_transporte, vehiculo.iedmt
        )
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


def desactivar_vehiculo(db: Session, vehiculo_id: int) -> Vehiculo | None:
    vehiculo = obtener_vehiculo_por_id(db, vehiculo_id)
    if not vehiculo:
        return None
    vehiculo.activo = False
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


def upsert_vehiculo_etl(db: Session, datos: VehiculoETL) -> Vehiculo:
    valores = datos.model_dump()
    valores["precio_final"] = _precio_final(datos.precio_base, datos.coste_transporte, datos.iedmt)
    stmt = (
        pg_insert(Vehiculo)
        .values(**valores)
        .on_conflict_do_update(
            constraint="uq_vehiculo_externo",
            set_={k: v for k, v in valores.items()
                  if k not in ("plataforma_origen", "id_anuncio_externo")},
        )
    )
    db.execute(stmt)
    db.commit()
    return db.query(Vehiculo).filter(
        Vehiculo.plataforma_origen == datos.plataforma_origen,
        Vehiculo.id_anuncio_externo == datos.id_anuncio_externo,
    ).first()
