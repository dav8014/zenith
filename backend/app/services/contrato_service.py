from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.contrato import Contrato, EstadoContrato
from app.models.vehiculo import Vehiculo
from app.schemas.contrato import ContratoCreate

VALOR_RESIDUAL = {
    (36, 10000): 0.45,
    (36, 15000): 0.40,
    (36, 20000): 0.35,
    (48, 10000): 0.35,
    (48, 15000): 0.30,
    (48, 20000): 0.25,
    (60, 10000): 0.28,
    (60, 15000): 0.23,
    (60, 20000): 0.18,
}

MANTENIMIENTO_ANUAL = Decimal("800.00")
SEGURO_ANUAL = Decimal("600.00")
MARGEN = Decimal("0.08")


def calcular_renting(precio: Decimal, meses: int, km: int, aportacion: Decimal) -> dict:
    anios = Decimal(str(meses / 12))

    coef = VALOR_RESIDUAL.get((meses, km), 0.30)
    valor_residual = precio * Decimal(str(coef))

    depreciacion = precio - valor_residual

    coste_mant = MANTENIMIENTO_ANUAL * anios
    coste_seguro = SEGURO_ANUAL * anios
    costes_totales = coste_mant + coste_seguro

    base = depreciacion + costes_totales

    margen = base * MARGEN

    total = base + margen

    a_pagar = total - aportacion
    if a_pagar < Decimal("0"):
        a_pagar = Decimal("0")

    cuota = (a_pagar / meses).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "cuota_mensual": cuota,
        "valor_residual": valor_residual.quantize(Decimal("0.01")),
        "depreciacion": depreciacion.quantize(Decimal("0.01")),
        "coste_mantenimiento": coste_mant.quantize(Decimal("0.01")),
        "coste_seguro": coste_seguro.quantize(Decimal("0.01")),
        "costes_operativos": costes_totales.quantize(Decimal("0.01")),
        "margen_zenith": margen.quantize(Decimal("0.01")),
        "base_imponible": base.quantize(Decimal("0.01")),
        "total_contrato": total.quantize(Decimal("0.01")),
        "a_pagar": a_pagar.quantize(Decimal("0.01")),
    }


def crear_contrato(db: Session, datos: ContratoCreate, usuario_id: int) -> Contrato | None:
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == datos.vehiculo_id).first()
    if not vehiculo or not vehiculo.activo:
        return None

    calc = calcular_renting(vehiculo.precio_final, datos.plazo_meses, datos.km_anuales, datos.aportacion_inicial)

    contrato = Contrato(
        usuario_id=usuario_id,
        vehiculo_id=datos.vehiculo_id,
        plazo_meses=datos.plazo_meses,
        km_anuales=datos.km_anuales,
        aportacion_inicial=datos.aportacion_inicial,
        valor_residual=calc["valor_residual"],
        coste_mantenimiento=calc["coste_mantenimiento"],
        coste_seguro=calc["coste_seguro"],
        margen_zenith=calc["margen_zenith"],
        base_imponible=calc["base_imponible"],
        cuota_mensual=calc["cuota_mensual"],
        total_contrato=calc["total_contrato"],
        estado=EstadoContrato.pendiente,
    )
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return contrato


def obtener_contrato_por_id(db: Session, contrato_id: int) -> Contrato | None:
    return db.query(Contrato).filter(Contrato.id == contrato_id).first()


def listar_contratos_usuario(db: Session, usuario_id: int) -> list[Contrato]:
    return db.query(Contrato).filter(Contrato.usuario_id == usuario_id).all()


def listar_todos_contratos(db: Session) -> list[Contrato]:
    return db.query(Contrato).all()


def actualizar_estado_contrato(
    db: Session, contrato_id: int, nuevo_estado: EstadoContrato
) -> Contrato | None:
    contrato = obtener_contrato_por_id(db, contrato_id)
    if not contrato:
        return None
    contrato.estado = nuevo_estado
    db.commit()
    db.refresh(contrato)
    return contrato
