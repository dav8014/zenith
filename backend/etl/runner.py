"""
Runner ETL — orquestador de las tres fases: extract → transform → load.
Ejecutar manualmente con:  python -m etl.runner  (desde backend/)
Cada fase loguea su duración; un fallo no interrumpe las fases siguientes,
salvo que la transformación no produzca ningún registro válido.
"""
import asyncio
import logging
import sys
from datetime import datetime

from app.core.database import SessionLocal
from etl.extractor import extract
from etl.loader import load
from etl.transformer import transform

# Logging con timestamp, nivel y módulo origen
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("etl.runner")


async def run() -> bool:
    """
    Ejecuta el pipeline completo ETL.
    Devuelve True si la carga fue exitosa, False en caso de error crítico.
    """
    logger.info("=" * 60)
    logger.info("ETL Zenith — inicio: %s", datetime.now().isoformat(timespec="seconds"))
    logger.info("=" * 60)

    # ── Fase 1: Extracción ─────────────────────────────────────────
    raw_records: list = []
    t_start = datetime.now()
    try:
        logger.info("[1/3] Extracción — mobile.de y autoscout24.es …")
        raw_records = await extract()
        elapsed = (datetime.now() - t_start).total_seconds()
        logger.info("[1/3] Extracción OK (%.1fs) — %d registros crudos", elapsed, len(raw_records))
    except Exception as exc:
        elapsed = (datetime.now() - t_start).total_seconds()
        logger.error("[1/3] Extracción fallida (%.1fs): %s", elapsed, exc)
        logger.info("[1/3] El transformer usará datos de fallback")

    # ── Fase 2: Transformación ─────────────────────────────────────
    clean_records: list = []
    t_start = datetime.now()
    try:
        logger.info("[2/3] Transformación — limpieza, traducción y cálculo de precios …")
        clean_records = transform(raw_records)
        elapsed = (datetime.now() - t_start).total_seconds()
        logger.info("[2/3] Transformación OK (%.1fs) — %d registros válidos", elapsed, len(clean_records))
    except Exception as exc:
        elapsed = (datetime.now() - t_start).total_seconds()
        logger.error("[2/3] Transformación fallida (%.1fs): %s", elapsed, exc)
        logger.error("[2/3] Sin datos para cargar — abortando")
        return False

    if not clean_records:
        logger.warning("[2/3] Sin registros tras la transformación — abortando carga")
        return False

    # ── Fase 3: Carga ──────────────────────────────────────────────
    t_start = datetime.now()
    db = SessionLocal()
    try:
        logger.info("[3/3] Carga — UPSERT en PostgreSQL …")
        stats = load(db, clean_records)
        elapsed = (datetime.now() - t_start).total_seconds()
        logger.info(
            "[3/3] Carga OK (%.1fs) — insertados: %d | actualizados: %d | desactivados: %d",
            elapsed, stats["insertados"], stats["actualizados"], stats["desactivados"],
        )
    except Exception as exc:
        elapsed = (datetime.now() - t_start).total_seconds()
        logger.error("[3/3] Carga fallida (%.1fs): %s", elapsed, exc)
        db.rollback()
        return False
    finally:
        db.close()

    logger.info("=" * 60)
    logger.info("ETL Zenith — fin: %s", datetime.now().isoformat(timespec="seconds"))
    logger.info("=" * 60)
    return True


if __name__ == "__main__":
    success = asyncio.run(run())
    sys.exit(0 if success else 1)
