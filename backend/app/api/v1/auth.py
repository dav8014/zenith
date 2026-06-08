from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password

from app.schemas.usuario import LoginRequest, TokenOut, UsuarioCreate, UsuarioOut, UsuarioRegistro
from app.services import usuario_service

from app.core.dependencies import get_current_admin
from app.models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Iniciar sesión",
    description=(
        "Autentica al usuario con email y contraseña. "
        "Devuelve un token JWT que debe enviarse en la cabecera "
        "`Authorization: Bearer <token>` en las peticiones protegidas."
    ),
)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = usuario_service.obtener_usuario_por_email(db, datos.email)
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 1. Extraemos el rol. Si es un Enum de SQLAlchemy, sacamos su valor en texto (ej: "admin")
    rol_str = usuario.rol.value if hasattr(usuario.rol, 'value') else usuario.rol
    
    # 2. Inyectamos el rol DENTRO del token junto con el email
    token = create_access_token({
        "sub": usuario.email,
        "rol": rol_str
    })
    
    return TokenOut(access_token=token, rol=rol_str)


@router.post(
    "/registro",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuario (Solo Admin)",
    description="Registra un nuevo usuario en el sistema. Operación restringida exclusivamente a administradores.",
)
def registro(
    datos: UsuarioRegistro, 
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_current_admin)  # LA BARRERA ARQUITECTÓNICA
):
    if usuario_service.obtener_usuario_por_email(db, datos.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El email ya está registrado",
        )

    nuevo = UsuarioCreate(
        nombre=datos.nombre,
        apellidos=datos.apellidos,
        email=datos.email,
        password=datos.password,
        rol=datos.rol,
    )
    return usuario_service.crear_usuario(db, nuevo)