"""
Transformer ETL — limpieza de datos, traducción alemán→español y motor de precios.
Si el scraping no devuelve datos, usa el dataset de fallback de 10 vehículos alemanes.
"""
import logging
import re
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)

# Coste fijo de transporte desde Alemania (euros)
COSTE_TRANSPORTE = Decimal("1200.00")

# Traducción de colores alemán → español
COLOR_MAP: dict[str, str] = {
    "schwarz": "Negro",
    "weiß": "Blanco",
    "weiss": "Blanco",
    "silber": "Plata",
    "grau": "Gris",
    "blau": "Azul",
    "rot": "Rojo",
    "grün": "Verde",
    "gruen": "Verde",
    "braun": "Marrón",
    "beige": "Beige",
    "gelb": "Amarillo",
    "orange": "Naranja",
    "violett": "Violeta",
}

# Traducción de combustible (alemán/inglés/español) → valor del enum del modelo
COMBUSTIBLE_MAP: dict[str, str] = {
    "benzin": "gasolina",
    "gasoline": "gasolina",
    "petrol": "gasolina",
    "gasolina": "gasolina",
    "diesel": "diesel",
    "diésel": "diesel",
    "elektro": "electrico",
    "electric": "electrico",
    "eléctrico": "electrico",
    "electrico": "electrico",
    "hybrid": "hibrido",
    "híbrido": "hibrido",
    "hibrido": "hibrido",
    "plug-in-hybrid": "hibrido_enchufable",
    "plug-in hybrid": "hibrido_enchufable",
    "hybride rechargeable": "hibrido_enchufable",
    "semi híbrido": "hibrido",
    "mild hybrid": "hibrido",
    "full hybrid": "hibrido",
    "phev": "hibrido_enchufable",
    "glp": "gasolina",
    "gnc": "gasolina",
}

FALLBACK_VEHICLES: list[dict[str, Any]] = [
    {"marca": "BMW", "modelo": "320d", "anio": 2021, "kilometraje": 45000, "combustible": "Diesel", "emisiones_co2": 118.0, "color": "Schwarz", "precio_base": "28500", "plataforma_origen": "mobile.de", "id_anuncio_externo": "fallback_001"},
    {"marca": "Volkswagen", "modelo": "Golf 1.5 TSI", "anio": 2022, "kilometraje": 22000, "combustible": "Benzin", "emisiones_co2": 130.0, "color": "Weiß", "precio_base": "22900", "plataforma_origen": "mobile.de", "id_anuncio_externo": "fallback_002"},
    {"marca": "Mercedes-Benz", "modelo": "C 220d", "anio": 2020, "kilometraje": 68000, "combustible": "Diesel", "emisiones_co2": 142.0, "color": "Silber", "precio_base": "31200", "plataforma_origen": "autoscout24.es", "id_anuncio_externo": "fallback_003"},
    {"marca": "Audi", "modelo": "A4 2.0 TDI", "anio": 2021, "kilometraje": 52000, "combustible": "Diesel", "emisiones_co2": 125.0, "color": "Grau", "precio_base": "29800", "plataforma_origen": "autoscout24.es", "id_anuncio_externo": "fallback_004"},
    {"marca": "Volkswagen", "modelo": "Passat 2.0 TDI", "anio": 2019, "kilometraje": 95000, "combustible": "Diesel", "emisiones_co2": 138.0, "color": "Blau", "precio_base": "18500", "plataforma_origen": "mobile.de", "id_anuncio_externo": "fallback_005"},
    {"marca": "Porsche", "modelo": "Taycan", "anio": 2022, "kilometraje": 15000, "combustible": "Elektro", "emisiones_co2": 0.0, "color": "Rot", "precio_base": "75000", "plataforma_origen": "mobile.de", "id_anuncio_externo": "fallback_006"},
    {"marca": "Opel", "modelo": "Astra 1.2 Turbo", "anio": 2021, "kilometraje": 38000, "combustible": "Benzin", "emisiones_co2": 145.0, "color": "Grün", "precio_base": "15800", "plataforma_origen": "autoscout24.es", "id_anuncio_externo": "fallback_007"},
    {"marca": "Ford", "modelo": "Focus 1.5 EcoBoost", "anio": 2020, "kilometraje": 61000, "combustible": "Benzin", "emisiones_co2": 128.0, "color": "Schwarz", "precio_base": "14200", "plataforma_origen": "autoscout24.es", "id_anuncio_externo": "fallback_008"},
    {"marca": "Skoda", "modelo": "Octavia 2.0 TDI", "anio": 2021, "kilometraje": 43000, "combustible": "Diesel", "emisiones_co2": 115.0, "color": "Grau", "precio_base": "19900", "plataforma_origen": "mobile.de", "id_anuncio_externo": "fallback_009"},
    {"marca": "Toyota", "modelo": "Corolla Hybrid", "anio": 2022, "kilometraje": 29000, "combustible": "Hybrid", "emisiones_co2": 95.0, "color": "Weiß", "precio_base": "24500", "plataforma_origen": "autoscout24.es", "id_anuncio_externo": "fallback_010"},
]


def _clean_number(value: str | None) -> Decimal:
    """
    Extrae el precio real de un string.
    Ignora valores menores a 1000 (cuotas de financiación).
    """
    if not value:
        return Decimal("0")

    raw_str = str(value).strip()

    # Elimina símbolos de moneda y texto extra
    cleaned = re.sub(r"[€$£]", "", raw_str)
    cleaned = re.sub(r"(?i)(desde|ab|por|/mes|mensual|,-)", "", cleaned)
    cleaned = cleaned.strip()

    # IMPORTANTE: primero intenta parsear como número simple (ej: "15000", "28500")
    # Esto maneja el caso más común del fallback y precios sin formatear
    simple_match = re.match(r"^(\d+)$", cleaned)
    if simple_match:
        val = float(simple_match.group(1))
        if val > 1000:
            return Decimal(str(val)).quantize(Decimal("0.01"))

    # Luego busca formatos europeos con separadores
    matches = re.findall(r"(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)", cleaned)
    for m in matches:
        s = m.replace(".", "").replace(",", ".")
        try:
            val = float(s)
            if val > 1000:
                return Decimal(str(val)).quantize(Decimal("0.01"))
        except Exception:
            pass

    # Finalmente busca cualquier número largo (4+ dígitos)
    matches = re.findall(r"(\d{4,})", cleaned)
    for m in matches:
        try:
            val = float(m)
            if val > 1000:
                return Decimal(str(val)).quantize(Decimal("0.01"))
        except Exception:
            pass

    return Decimal("0")


def _clean_int(value: str | None) -> int:
    """Extrae el primer número entero de un string."""
    if not value:
        return 0

    # Formato con puntos de miles: 45.000
    match = re.search(r"(\d{1,3}(?:\.\d{3})+)", str(value))
    if match:
        return int(match.group(1).replace(".", ""))

    # Número simple
    match = re.search(r"(\d+)", str(value))
    if match:
        try:
            return int(match.group(1))
        except Exception:
            return 0

    return 0


def _clean_year(value: str | None) -> int:
    """Extrae el año de strings como '03/2021', 'EZ 2021' o simplemente '2021'."""
    if not value:
        return 2020
    match = re.search(r"\b(19|20)\d{2}\b", str(value))
    return int(match.group()) if match else 2020


def _translate_color(raw: str | None) -> str | None:
    if not raw:
        return None
    return COLOR_MAP.get(raw.strip().lower(), raw.strip().capitalize())


def _translate_combustible(raw: str | None) -> str:
    if not raw:
        return "gasolina"
    key = raw.strip().lower()
    for k, v in COMBUSTIBLE_MAP.items():
        if k in key or key in k:
            return v
    return "gasolina"


def _calcular_iedmt(precio_base: Decimal, emisiones: float | None) -> Decimal:
    if emisiones is None or emisiones == 0:
        return Decimal("0")
    if emisiones <= 120:
        return Decimal("0")
    if emisiones <= 159:
        tasa = Decimal("0.0475")
    elif emisiones <= 199:
        tasa = Decimal("0.0975")
    else:
        tasa = Decimal("0.1475")
    return (precio_base * tasa).quantize(Decimal("0.01"))


MARGEN_ZENITH_PORCENTAJE = Decimal("1750.00")


def _transform_record(raw: dict[str, Any]) -> dict[str, Any] | None:
    try:
        precio_base = _clean_number(raw.get("precio_base"))

        if precio_base <= 0:
            logger.warning(
                "DESCARTADO precio=0 — %s %s — raw='%s'",
                raw.get("marca", "?"), raw.get("modelo", "?"), raw.get("precio_base", "?")
            )
            return None

        emisiones_raw = raw.get("emisiones_co2")
        if isinstance(emisiones_raw, str):
            match = re.search(r"\d+", emisiones_raw)
            emisiones: float | None = float(match.group()) if match else None
        else:
            emisiones = float(emisiones_raw) if emisiones_raw is not None else None

        iedmt = _calcular_iedmt(precio_base, emisiones)

        subtotal_costes = precio_base + COSTE_TRANSPORTE + iedmt
        margen_zenith = (subtotal_costes * MARGEN_ZENITH_PORCENTAJE).quantize(Decimal("0.01"))
        precio_final = precio_base + COSTE_TRANSPORTE + iedmt + margen_zenith

        combustible = _translate_combustible(raw.get("combustible"))

        return {
            "marca": str(raw.get("marca", "Desconocido")).strip(),
            "modelo": str(raw.get("modelo", "Desconocido")).strip(),
            "anio": _clean_year(str(raw.get("anio", "2020"))),
            "kilometraje": _clean_int(str(raw.get("kilometraje", "0"))),
            "combustible": combustible,
            "emisiones_co2": emisiones,
            "color": _translate_color(raw.get("color")),
            "precio_base": precio_base,
            "coste_transporte": COSTE_TRANSPORTE,
            "iedmt": iedmt,
            "margen_zenith": margen_zenith,
            "precio_final": precio_final,
            "origen": "importado",
            "plataforma_origen": raw.get("plataforma_origen", "desconocido"),
            "id_anuncio_externo": str(raw.get("id_anuncio_externo", "")),
            "imagen_url": raw.get("imagen_url"),
        }
    except Exception as exc:
        logger.warning("EXCEPCIÓN — %s %s — %s", raw.get("marca", "?"), raw.get("modelo", "?"), exc)
        return None


def transform(raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    source = raw_records if raw_records else FALLBACK_VEHICLES
    if not raw_records:
        logger.warning(
            "Sin datos del scraping — usando fallback (%d vehículos simulados)",
            len(FALLBACK_VEHICLES),
        )

    for i, rec in enumerate(source[:3]):
        logger.info(
            "MUESTRA #%d — marca=%s precio='%s' km='%s'",
            i, rec.get("marca"), rec.get("precio_base"), rec.get("kilometraje")
        )

    cleaned = [_transform_record(rec) for rec in source]
    valid = [r for r in cleaned if r is not None]

    logger.info(
        "Transformación: %d/%d registros válidos (descartados: %d)",
        len(valid), len(source), len(source) - len(valid),
    )
    return valid