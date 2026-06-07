from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.usuario import RolUsuario, Usuario
from app.schemas.contrato import ContratoCreate, ContratoOut, ContratoUpdate, ContratoDetalle
from app.services import contrato_service, pdf_service

router = APIRouter(prefix="/contratos", tags=["Solicitudes de renting"])


@router.post(
    "",
    response_model=ContratoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Solicitar contrato de renting",
    description=(
        "Crea una nueva solicitud de renting para el vehículo indicado. "
        "La cuota mensual y el total se calculan automáticamente con la "
        "fórmula de amortización francesa. El estado inicial es 'pendiente'."
    ),
)
def crear_contrato(
    datos: ContratoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = contrato_service.crear_contrato(db, datos, usuario.id)
    if not contrato:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado o no disponible",
        )
    return contrato


# Debe ir antes que /{contrato_id} para evitar colisión con el path param int
@router.get(
    "/mis-contratos",
    response_model=list[ContratoDetalle],
    summary="Mis contratos",
    description="Devuelve todos los contratos de renting del cliente autenticado.",
)
def mis_contratos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return contrato_service.listar_contratos_usuario(db, usuario.id)

#dadad
@router.get(
    "",
    response_model=list[ContratoOut],
    summary="Listar todos los contratos",
    description="Devuelve todos los contratos del sistema, de cualquier cliente. Solo para administradores.",
)
def listar_contratos(
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_current_admin),
):
    return contrato_service.listar_todos_contratos(db)


@router.get(
    "/{contrato_id}",
    response_model=ContratoOut,
    summary="Ver detalle de contrato",
    description=(
        "Devuelve el detalle de un contrato. "
        "Un cliente solo puede consultar sus propios contratos; "
        "un administrador puede consultar cualquiera."
    ),
)
def obtener_contrato(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = contrato_service.obtener_contrato_por_id(db, contrato_id)
    if not contrato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato no encontrado")
    if usuario.rol != RolUsuario.admin and contrato.usuario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    return contrato


@router.get(
    "/{contrato_id}/pdf",
    summary="Descargar precontrato PDF",
    description=(
        "Genera y descarga el precontrato de renting en formato PDF. "
        "Accesible por el administrador o el propietario del contrato."
    ),
)
def descargar_pdf(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = contrato_service.obtener_contrato_por_id(db, contrato_id)
    if not contrato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato no encontrado")
    if usuario.rol != RolUsuario.admin and contrato.usuario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    pdf_bytes = pdf_service.generar_precontrato(contrato, contrato.usuario, contrato.vehiculo)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="precontrato_{contrato_id}.pdf"'},
    )


@router.patch(
    "/{contrato_id}/estado",
    response_model=ContratoOut,
    summary="Actualizar estado del contrato",
    description=(
        "Cambia el estado de una solicitud de renting. "
        "Estados disponibles: `pendiente`, `en_revision`, `aceptado`, `rechazado`. "
        "Solo accesible para administradores."
    ),
)
def actualizar_estado(
    contrato_id: int,
    datos: ContratoUpdate,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_current_admin),
):
    contrato = contrato_service.actualizar_estado_contrato(db, contrato_id, datos.estado)
    if not contrato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato no encontrado")
    return contrato
