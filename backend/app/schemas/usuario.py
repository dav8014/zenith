from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.usuario import RolUsuario

from typing import Optional


class UsuarioBase(BaseModel):
    nombre: str
    apellidos: str
    email: EmailStr


class UsuarioCreate(UsuarioBase):
    password: str
    rol: RolUsuario = RolUsuario.cliente


class UsuarioOut(UsuarioBase):
    id: int
    rol: RolUsuario

    model_config = ConfigDict(from_attributes=True)


class UsuarioRegistro(BaseModel):
    nombre: str
    apellidos: str
    email: EmailStr
    password: str
    rol: RolUsuario = RolUsuario.cliente


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: Optional[str] = None  # <-- LA PUERTA PARA QUE SALGA EL ROL