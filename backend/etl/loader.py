"""
Loader ETL — UPSERT de vehículos en PostgreSQL y desactivación de bajas.
Usa la sesión SQLAlchemy existente y vehiculo_service.upsert_vehiculo_etl().
"""
import logging
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoETL
from app.services import vehiculo_service

logger = logging.getLogger(__name__)


def _record_to_schema(rec: dict) -> VehiculoETL:
    """Convierte un dict transformado al schema VehiculoETL para el UPSERT."""
    return VehiculoETL(
        marca=rec["marca"],
        modelo=rec["modelo"],
        anio=rec["anio"],
        kilometraje=rec["kilometraje"],
        combustible=rec["combustible"],
        emisiones_co2=rec.get("emisiones_co2"),
        color=rec.get("color"),
        precio_base=Decimal(str(rec["precio_base"])),
        coste_transporte=Decimal(str(rec["coste_transporte"])),
        iedmt=Decimal(str(rec["iedmt"])),
        margen_zenith=Decimal(str(rec["margen_zenith"])), # NUEVO
        precio_final=Decimal(str(rec["precio_final"])),   # NUEVO
        origen=rec["origen"],
        plataforma_origen=rec["plataforma_origen"],
        id_anuncio_externo=rec["id_anuncio_externo"],
        imagen_url=rec.get("imagen_url"),
    )


def load(db: Session, records: list[dict]) -> dict[str, int]:
    """
    Hace UPSERT de todos los registros y desactiva los vehículos importados
    que ya no aparecen en la extracción actual (dados de baja en la plataforma).
    Devuelve estadísticas: insertados, actualizados, desactivados.
    """
    if not records:
        logger.warning("Loader: lista de registros vacía — no se realizan cambios")
        return {"insertados": 0, "actualizados": 0, "desactivados": 0}

    # Agrupa los IDs externos de la extracción actual por plataforma
    ids_actuales: dict[str, set[str]] = {}
    for rec in records:
        plataforma = rec["plataforma_origen"]
        ids_actuales.setdefault(plataforma, set()).add(rec["id_anuncio_externo"])

    # Obtiene los IDs activos en BD para las plataformas procesadas (para detectar bajas)
    plataformas = list(ids_actuales.keys())
    activos_en_bd = (
        db.query(Vehiculo.plataforma_origen, Vehiculo.id_anuncio_externo)
        .filter(
            Vehiculo.plataforma_origen.in_(plataformas),
            Vehiculo.activo == True,  # noqa: E712
        )
        .all()
    )
    ids_en_bd: dict[str, set[str]] = {}
    for plataforma, id_ext in activos_en_bd:
        ids_en_bd.setdefault(plataforma, set()).add(id_ext)

    # UPSERT de cada registro; cuenta inserciones vs actualizaciones
    insertados = 0
    actualizados = 0
    for rec in records:
        # Detecta si el vehículo ya existe para clasificar la operación
        existe = (
            db.query(Vehiculo.id)
            .filter(
                Vehiculo.plataforma_origen == rec["plataforma_origen"],
                Vehiculo.id_anuncio_externo == rec["id_anuncio_externo"],
            )
            .first()
        )

        schema = _record_to_schema(rec)
        vehiculo_service.upsert_vehiculo_etl(db, schema)

        if existe:
            actualizados += 1
        else:
            insertados += 1

    # Desactiva los vehículos que ya no están en la extracción actual
    desactivados = 0
    for plataforma, ids_bd_plataforma in ids_en_bd.items():
        ids_a_desactivar = ids_bd_plataforma - ids_actuales.get(plataforma, set())
        if ids_a_desactivar:
            count = (
                db.query(Vehiculo)
                .filter(
                    Vehiculo.plataforma_origen == plataforma,
                    Vehiculo.id_anuncio_externo.in_(ids_a_desactivar),
                )
                .update({"activo": False}, synchronize_session=False)
            )
            desactivados += count

    db.commit()

    logger.info(
        "Carga completada — insertados: %d | actualizados: %d | desactivados: %d",
        insertados, actualizados, desactivados,
    )
    return {"insertados": insertados, "actualizados": actualizados, "desactivados": desactivados}
