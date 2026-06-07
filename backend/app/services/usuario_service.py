from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.contrato import Contrato
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate


def crear_usuario(db: Session, datos: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        nombre=datos.nombre,
        apellidos=datos.apellidos,
        email=datos.email,
        password_hash=hash_password(datos.password),
        rol=datos.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def obtener_usuario_por_email(db: Session, email: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.email == email).first()


def obtener_usuario_por_id(db: Session, usuario_id: int) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def listar_usuarios(db: Session) -> list[Usuario]:
    return db.query(Usuario).all()


def eliminar_usuario(db: Session, usuario_id: int) -> bool:
    usuario = obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        return False
    db.query(Contrato).filter(Contrato.usuario_id == usuario_id).delete(synchronize_session=False)
    db.delete(usuario)
    db.commit()
    return True
