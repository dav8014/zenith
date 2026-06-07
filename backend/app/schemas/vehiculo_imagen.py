from pydantic import BaseModel, ConfigDict


class VehiculoImagenOut(BaseModel):
    id: int
    vehiculo_id: int
    imagen_url: str
    orden: int

    model_config = ConfigDict(from_attributes=True)


class VehiculoImagenCreate(BaseModel):
    imagen_url: str
    orden: int = 0
