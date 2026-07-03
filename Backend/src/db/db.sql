-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS parqueadero_aeropuerto;
USE parqueadero_aeropuerto;

-- =====================================================================
-- 1. TABLAS INDEPENDIENTES Y DE CONFIGURACIÓN
-- =====================================================================

-- Tabla de roles (Entidad: Rol)
CREATE TABLE IF NOT EXISTS roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de usuarios/empleados (Entidad: Usuario)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT
);

-- Tabla de reportes (Entidad: Reporte)
CREATE TABLE IF NOT EXISTS reportes (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo_reporte ENUM('Financiero', 'Estadistico') NOT NULL,
    periodo_reporte ENUM('Diario', 'Mensual') NOT NULL,
    fecha_generado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de tarifas (Entidad: Tarifa adaptada a los 5 rangos del aeropuerto)
CREATE TABLE IF NOT EXISTS tarifas (
    id_tarifa INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL, -- Usuario que administra/crea la tarifa
    tipo_vehiculo VARCHAR(50) NOT NULL UNIQUE,
    valor_primera_hora DECIMAL(10,2) NOT NULL,       -- Rango 1
    valor_hora_2_a_12 DECIMAL(10,2) NOT NULL,        -- Rango 2
    valor_hora_13_a_168 DECIMAL(10,2) NOT NULL,      -- Rango 3
    valor_hora_169_mas DECIMAL(10,2) NOT NULL,       -- Rango 4
    valor_mensualidad DECIMAL(10,2) NOT NULL,        -- Rango 5
    normativa VARCHAR(100) DEFAULT 'Resolución Aeropuerto',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

-- Tabla de historial de tarifas (Auditoría de cambios de precios)
CREATE TABLE IF NOT EXISTS historial_tarifas (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_tarifa INT NOT NULL,
    id_usuario INT NOT NULL, -- Empleado que hizo la modificación
    tipo_vehiculo VARCHAR(50) NOT NULL,
   
    -- Valores anteriores
    ant_primera_hora DECIMAL(10,2),
    ant_hora_2_a_12 DECIMAL(10,2),
    ant_hora_13_a_168 DECIMAL(10,2),
    ant_hora_169_mas DECIMAL(10,2),
    ant_mensualidad DECIMAL(10,2),
   
    -- Valores nuevos
    nue_primera_hora DECIMAL(10,2),
    nue_hora_2_a_12 DECIMAL(10,2),
    nue_hora_13_a_168 DECIMAL(10,2),
    nue_hora_169_mas DECIMAL(10,2),
    nue_mensualidad DECIMAL(10,2),
   
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tarifa) REFERENCES tarifas(id_tarifa) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

-- Tabla de vehículos (Entidad: Vehiculo)
CREATE TABLE IF NOT EXISTS vehiculos (
    placa_vehiculo VARCHAR(10) PRIMARY KEY,
    modelo VARCHAR(50),
    marca VARCHAR(50)
);

-- Tabla de clientes (Entidad: Cliente)
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(150) NOT NULL,
    identificacion VARCHAR(20) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    -- Dirección desglosada (Atributo compuesto)
    dir_barrio VARCHAR(50),
    dir_calle VARCHAR(30),
    dir_carrera VARCHAR(30),
    dir_numero VARCHAR(20),
    telefono VARCHAR(20),
    contrasena VARCHAR(255) NOT NULL,
    placa_vehiculo VARCHAR(10) NULL,
    FOREIGN KEY (placa_vehiculo) REFERENCES vehiculos(placa_vehiculo) ON DELETE SET NULL
);

-- Tabla de mensualidades (Entidad: Mensualidad)
CREATE TABLE IF NOT EXISTS mensualidades (
    id_mensualidad INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    placa_vehiculo VARCHAR(10) NOT NULL,
    id_usuario INT NOT NULL, -- Usuario que vende la mensualidad
    fecha_inicio DATE NOT NULL,
    fecha_final DATE NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (placa_vehiculo) REFERENCES vehiculos(placa_vehiculo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

-- Tabla de control de ingresos y salidas (Entidad: Control_I_S)
CREATE TABLE IF NOT EXISTS control_i_s (
    id_control_i_s INT AUTO_INCREMENT PRIMARY KEY,
    placa_vehiculo VARCHAR(10) NOT NULL,
    id_tarifa INT NOT NULL,
    hora_ingreso DATETIME NOT NULL,
    fecha_ingreso DATE NOT NULL,
    hora_salida DATETIME NULL,
    fecha_salida DATE NULL,
    calculo_tarifa DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (placa_vehiculo) REFERENCES vehiculos(placa_vehiculo) ON DELETE CASCADE,
    FOREIGN KEY (id_tarifa) REFERENCES tarifas(id_tarifa) ON DELETE RESTRICT
);

-- Tabla de pagos (Entidad: Pago - Relación 1:1 con Control_I_S)
CREATE TABLE IF NOT EXISTS pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_control_i_s INT NOT NULL UNIQUE,
    metodo_pago ENUM('Efectivo', 'Transferencia', 'QR') NOT NULL,
    FOREIGN KEY (id_control_i_s) REFERENCES control_i_s(id_control_i_s) ON DELETE CASCADE
);

-- =====================================================================
-- 3. INSERCIÓN DE DATOS SEMILLA (Semillas Iniciales)
-- =====================================================================

-- Insertar Roles
INSERT IGNORE INTO roles (id_rol, nombre_rol) VALUES
(1, 'Admin'),
(2, 'Operario');

-- Insertar Usuario Administrador Base
INSERT IGNORE INTO usuarios (id_usuario, nombre_usuario, id_rol) VALUES
(1, 'Admin General Alfonso Bonilla', 1);

-- Insertar Tarifas Oficiales por Bloques
INSERT IGNORE INTO tarifas (id_usuario, tipo_vehiculo, valor_primera_hora, valor_hora_2_a_12, valor_hora_13_a_168, valor_hora_169_mas, valor_mensualidad) VALUES
(1, 'Automovil', 4300.00, 2600.00, 35500.00, 31200.00, 178900.00),
(1, 'Campero', 4300.00, 2600.00, 35500.00, 31200.00, 178900.00),
(1, 'Camioneta', 4300.00, 2600.00, 35500.00, 31200.00, 178900.00),
(1, 'Microbus', 4300.00, 2600.00, 35500.00, 31200.00, 178900.00),
(1, 'Motocarro', 4300.00, 2600.00, 35500.00, 31200.00, 178900.00),
(1, 'Motocicleta', 2700.00, 1500.00, 18000.00, 15000.00, 67200.00),
(1, 'Bicicleta', 700.00, 400.00, 4500.00, 4000.00, 16800.00);