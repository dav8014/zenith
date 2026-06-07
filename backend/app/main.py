"""
Punto de entrada principal de la aplicación Zenith API.

Para arrancar el servidor en desarrollo:
    uvicorn app.main:app --reload
"""
print("1. Entrando en main.py...")
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
from fastapi.requests import Request

from app.core.config import get_settings
from app.core.database import Base, engine
from app.api.v1 import auth, contratos, usuarios, vehiculos, operaciones
print("2. Imports terminados. Levantando servidor...")

settings = get_settings()
security = HTTPBearer()

openapi_tags = [
    {
        "name": "Autenticación",
        "description": (
            "Registro e inicio de sesión. "
            "Tras hacer login, copia el token y úsalo en la cabecera "
            "`Authorization: Bearer <token>` para acceder a los endpoints protegidos."
        ),
    },
    {
        "name": "Gestión de usuarios",
        "description": "Administración de cuentas de usuario. Requiere rol de administrador.",
    },
    {
        "name": "Catálogo de vehículos",
        "description": "Consulta y gestión del inventario de vehículos nacionales e importados desde Alemania.",
    },
    {
        "name": "Solicitudes de renting",
        "description": "Creación y seguimiento de contratos de renting de vehículos.",
    },
    {
        "name": "Operaciones y Ventas",
        "description": "Motor de transacciones unificado para reservas de importación y firmas de renting.",
    },
]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description=(
        "API REST del concesionario Zenith. "
        "Gestión de renting de vehículos y servicio de importación desde Alemania."
    ),
    openapi_tags=openapi_tags,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Tu frontend
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE
    allow_headers=["*"], # ESTA ES LA CLAVE: Permite 'Authorization' y 'Content-Type'
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(usuarios.router, prefix=settings.API_PREFIX)
app.include_router(vehiculos.router, prefix=settings.API_PREFIX)
app.include_router(contratos.router, prefix=settings.API_PREFIX)
app.include_router(operaciones.router, prefix=settings.API_PREFIX, tags=["Operaciones y Ventas"])


@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    import traceback
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detalle": traceback.format_exc()}
    )

@app.get("/", tags=["Salud"], summary="Estado del servidor")
async def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
    }