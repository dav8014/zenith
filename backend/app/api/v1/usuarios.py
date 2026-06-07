from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioOut
from app.services import usuario_service

router = APIRouter(prefix="/usuarios", tags=["Gestión de usuarios"])


@router.get(
    "",
    response_model=list[UsuarioOut],
    summary="Listar usuarios",
    description="Devuelve todos los usuarios registrados en el sistema.",
)
def listar_usuarios(
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_current_admin),
):
    return usuario_service.listar_usuarios(db)


@router.get(
    "/{usuario_id}",
    response_model=UsuarioOut,
    summary="Obtener usuario por ID",
    description="Devuelve los datos de un usuario concreto a partir de su identificador.",
)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_current_admin),
):
    usuario = usuario_service.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_200_OK,
    summary="Eliminar usuario",
    description="Elimina permanentemente un usuario del sistema. Esta acción no se puede deshacer.",
)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_current_admin),
):
    if not usuario_service.eliminar_usuario(db, usuario_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return {"detail": "usuario eliminado"}
