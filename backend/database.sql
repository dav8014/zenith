-- ============================================================
-- ZENITH — Script completo de base de datos
-- ============================================================

-- ENUMS
CREATE TYPE rol_usuario AS ENUM ('admin', 'cliente');
CREATE TYPE combustible AS ENUM ('gasolina', 'diesel', 'electrico', 'hibrido', 'hibrido_enchufable');
CREATE TYPE origen_vehiculo AS ENUM ('nacional', 'importado');
CREATE TYPE estado_logistico AS ENUM ('disponible', 'reservado', 'en_transito', 'entregado');
CREATE TYPE estado_contrato AS ENUM ('pendiente', 'en_revision', 'aceptado', 'rechazado');

-- ============================================================
-- TABLA USUARIOS
-- ============================================================
CREATE TABLE usuarios (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    apellidos         VARCHAR(150) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    rol               rol_usuario  NOT NULL DEFAULT 'cliente',
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA VEHICULOS
-- ============================================================
CREATE TABLE vehiculos (
    id                   SERIAL PRIMARY KEY,
    marca                VARCHAR(100)    NOT NULL,
    modelo               VARCHAR(100)    NOT NULL,
    anio                 INTEGER         NOT NULL,
    kilometraje          INTEGER         NOT NULL DEFAULT 0,
    combustible          combustible     NOT NULL,
    emisiones_co2        FLOAT,
    color                VARCHAR(50),
    tipo_cambio          VARCHAR(20),
    potencia             INTEGER,
    num_puertas          INTEGER,
    precio_base          NUMERIC(12,2)   NOT NULL,
    coste_transporte     NUMERIC(12,2)   NOT NULL DEFAULT 0,
    iedmt                NUMERIC(12,2)   NOT NULL DEFAULT 0,
    precio_final         NUMERIC(12,2)   NOT NULL,
    origen               origen_vehiculo NOT NULL,
    estado_logistico     estado_logistico NOT NULL DEFAULT 'disponible',
    plataforma_origen    VARCHAR(100),
    id_anuncio_externo   VARCHAR(100),
    imagen_url           VARCHAR(500),
    activo               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP       NOT NULL DEFAULT NOW(),
    UNIQUE (plataforma_origen, id_anuncio_externo)
    ALTER TABLE vehiculos 
ADD COLUMN margen_zenith NUMERIC(12,2) NOT NULL DEFAULT 0;
);

-- NUEVO
CREATE TABLE operaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL, 
    
    -- LA CORRECCIÓN: Apuntamos al ID interno (Primary Key) de tu tabla vehículos
    vehiculo_id INT NOT NULL REFERENCES vehiculos(id), 
    
    tipo_operacion VARCHAR(20) NOT NULL,
    estado VARCHAR(30) DEFAULT 'pendiente_pago',
    importe_total NUMERIC(10, 2) NOT NULL,
    margen_zenith NUMERIC(10, 2) NOT NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas_internas TEXT
);
-- ============================================================
-- TABLA VEHICULO_IMAGENES (galería de imágenes por vehículo)
-- ============================================================
CREATE TABLE vehiculo_imagenes (
    id          SERIAL PRIMARY KEY,
    vehiculo_id INTEGER      NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    imagen_url  VARCHAR(500) NOT NULL,
    orden       INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_vehiculo_imagenes_vehiculo ON vehiculo_imagenes(vehiculo_id);

-- ============================================================
-- TABLA CONTRATOS
-- ============================================================
CREATE TABLE contratos (
    id                SERIAL PRIMARY KEY,
    usuario_id        INTEGER         NOT NULL REFERENCES usuarios(id),
    vehiculo_id       INTEGER         NOT NULL REFERENCES vehiculos(id),
    plazo_meses       INTEGER         NOT NULL,
    interes_anual     NUMERIC(5,2)    NOT NULL,
    cuota_mensual     NUMERIC(12,2)   NOT NULL,
    total_intereses   NUMERIC(12,2)   NOT NULL,
    total_contrato    NUMERIC(12,2)   NOT NULL,
    estado            estado_contrato NOT NULL DEFAULT 'pendiente',
    fecha_solicitud   TIMESTAMP       NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATOS DE PRUEBA — USUARIOS
-- contraseña: Admin1234!
-- ============================================================
INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol) VALUES
('Carlos', 'Martínez López', 'admin@zenith.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQsGl1wTrxIi', 'admin'),
('Laura', 'García Fernández', 'laura@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQsGl1wTrxIi', 'cliente'),
('Miguel', 'Sánchez Ruiz', 'miguel@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQsGl1wTrxIi', 'cliente'),
('Ana', 'López Torres', 'ana@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBAQsGl1wTrxIi', 'cliente');

-- ============================================================
-- DATOS DE PRUEBA — VEHÍCULOS NACIONALES (muestra)
-- ============================================================
INSERT INTO vehiculos (marca, modelo, anio, kilometraje, combustible, emisiones_co2, color, tipo_cambio, potencia, num_puertas, precio_base, coste_transporte, iedmt, precio_final, origen, estado_logistico, imagen_url) VALUES
('Seat', 'León 1.5 TSI FR', 2020, 45000, 'gasolina', 118, 'Rojo', 'manual', 150, 5, 18500.00, 0, 0, 18500.00, 'nacional', 'disponible', '/cars/seat.jpg'),
('Volkswagen', 'Golf 2.0 TDI', 2019, 62000, 'diesel', 112, 'Gris', 'manual', 150, 5, 17800.00, 0, 0, 17800.00, 'nacional', 'disponible', '/cars/volkswagen.jpg'),
('Renault', 'Mégane 1.5 dCi', 2020, 38000, 'diesel', 108, 'Azul', 'manual', 115, 5, 16200.00, 0, 0, 16200.00, 'nacional', 'disponible', '/cars/renault.jpg'),
('Peugeot', '308 1.2 PureTech', 2021, 28000, 'gasolina', 122, 'Blanco', 'automatico', 130, 5, 19500.00, 0, 0, 19500.00, 'nacional', 'disponible', '/cars/peugeot.jpg'),
('Ford', 'Focus 1.5 EcoBoost', 2020, 51000, 'gasolina', 128, 'Negro', 'manual', 150, 5, 17200.00, 0, 0, 17200.00, 'nacional', 'disponible', '/cars/ford.jpg'),
('Toyota', 'Corolla 1.8 Hybrid', 2021, 32000, 'hibrido', 90, 'Plata', 'automatico', 122, 5, 22000.00, 0, 0, 22000.00, 'nacional', 'disponible', '/cars/toyota.jpg'),
('Hyundai', 'Tucson 1.6 CRDi', 2020, 47000, 'diesel', 132, 'Gris', 'manual', 136, 5, 21500.00, 0, 0, 21500.00, 'nacional', 'disponible', '/cars/hyundai.jpg'),
('Kia', 'Sportage 1.6 T-GDI', 2021, 35000, 'gasolina', 148, 'Azul', 'automatico', 177, 5, 23800.00, 0, 0, 23800.00, 'nacional', 'disponible', '/cars/kia.jpg'),
('BMW', '118i', 2020, 44000, 'gasolina', 132, 'Negro', 'automatico', 140, 5, 24500.00, 0, 0, 24500.00, 'nacional', 'disponible', '/cars/bmw.jpg'),
('Mercedes-Benz', 'Clase A 180d', 2020, 38000, 'diesel', 108, 'Plata', 'automatico', 116, 5, 25800.00, 0, 0, 25800.00, 'nacional', 'disponible', '/cars/mercedes.jpg'),
('Audi', 'A3 Sportback 35 TFSI', 2021, 33000, 'gasolina', 128, 'Gris', 'automatico', 150, 5, 27500.00, 0, 0, 27500.00, 'nacional', 'disponible', '/cars/audi.jpg'),
('Tesla', 'Model 3', 2022, 15000, 'electrico', 0, 'Blanco', 'automatico', 283, 4, 42000.00, 0, 0, 42000.00, 'nacional', 'disponible', '/cars/tesla.jpg'),
('Volvo', 'XC40 Recharge', 2022, 15000, 'electrico', 0, 'Azul', 'automatico', 231, 5, 46500.00, 0, 0, 46500.00, 'nacional', 'disponible', '/cars/volvo.jpg'),
('Mini', 'Cooper S 3 puertas', 2021, 26000, 'gasolina', 148, 'Rojo', 'manual', 178, 3, 26500.00, 0, 0, 26500.00, 'nacional', 'disponible', '/cars/mini.jpg'),
('Honda', 'Civic 1.5 VTEC Turbo', 2020, 39000, 'gasolina', 135, 'Negro', 'manual', 182, 5, 21000.00, 0, 0, 21000.00, 'nacional', 'disponible', '/cars/honda.jpg');

-- ============================================================
-- DATOS DE PRUEBA — VEHÍCULOS IMPORTADOS
-- ============================================================
INSERT INTO vehiculos (marca, modelo, anio, kilometraje, combustible, emisiones_co2, color, tipo_cambio, potencia, num_puertas, precio_base, coste_transporte, iedmt, precio_final, origen, estado_logistico, plataforma_origen, id_anuncio_externo, imagen_url) VALUES
('BMW', '320d', 2020, 55000, 'diesel', 122, 'Negro', 'automatico', 190, 4, 24500.00, 1200.00, 1163.75, 26863.75, 'importado', 'disponible', 'autoscout24.es', 'MDE-123456', NULL),
('Audi', 'A4 2.0 TDI', 2021, 42000, 'diesel', 128, 'Gris', 'automatico', 163, 4, 27800.00, 1200.00, 1321.50, 30321.50, 'importado', 'en_transito', 'autoscout24.es', 'AS24-789012', NULL),
('Mercedes-Benz', 'Clase C 220d', 2020, 48000, 'gasolina', 145, 'Plata', 'automatico', 184, 4, 29900.00, 1200.00, 2892.13, 33992.13, 'importado', 'disponible', 'autoscout24.es', 'MDE-234567', NULL),
('Volkswagen', 'Passat 2.0 TDI', 2019, 78000, 'diesel', 115, 'Azul', 'automatico', 150, 4, 18900.00, 1200.00, 0, 20100.00, 'importado', 'disponible', 'autoscout24.es', 'AS24-345678', NULL),
('Porsche', 'Cayenne PHEV', 2021, 32000, 'hibrido_enchufable', 68, 'Negro', 'automatico', 340, 5, 68000.00, 1500.00, 0, 69500.00, 'importado', 'reservado', 'autoscout24.es', 'MDE-456789', NULL),
('BMW', 'X3 xDrive20d', 2022, 18000, 'diesel', 158, 'Blanco', 'automatico', 190, 5, 38500.00, 1200.00, 3752.63, 43452.63, 'importado', 'entregado', 'autoscout24.es', 'AS24-567890', NULL);

-- ============================================================
-- DATOS DE PRUEBA — CONTRATOS
-- ============================================================
INSERT INTO contratos (usuario_id, vehiculo_id, plazo_meses, interes_anual, cuota_mensual, total_intereses, total_contrato, estado, fecha_solicitud) VALUES
(2, 1, 36, 6.50, 507.43, 1767.48, 18267.48, 'aceptado', NOW() - INTERVAL '15 days'),
(3, 16, 48, 5.90, 630.21, 3850.08, 30670.08, 'en_revision', NOW() - INTERVAL '3 days'),
(4, 3, 24, 7.00, 815.67, 1356.08, 19556.08, 'pendiente', NOW() - INTERVAL '1 day'),
(2, 18, 60, 5.50, 648.73, 8923.80, 38923.80, 'rechazado', NOW() - INTERVAL '30 days'),
(3, 5, 36, 4.90, 1254.18, 5150.48, 45150.48, 'pendiente', NOW());

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_vehiculos_origen     ON vehiculos(origen);
CREATE INDEX idx_vehiculos_activo     ON vehiculos(activo);
CREATE INDEX idx_vehiculos_marca      ON vehiculos(marca);
CREATE INDEX idx_vehiculos_externo    ON vehiculos(id_anuncio_externo);
CREATE INDEX idx_contratos_usuario    ON contratos(usuario_id);
CREATE INDEX idx_contratos_vehiculo   ON contratos(vehiculo_id);
CREATE INDEX idx_contratos_estado     ON contratos(estado);
CREATE INDEX idx_usuarios_email       ON usuarios(email);