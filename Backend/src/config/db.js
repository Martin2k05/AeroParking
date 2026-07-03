const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del pool de conexiones (Prioriza .env, usa local como fallback)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'parqueadero_aeropuerto',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Asegurar que las columnas de autenticación y roles existan
const initDbModifications = async () => {
  try {
    // Insertar rol cliente si no existe
    await pool.query("INSERT IGNORE INTO roles (id_rol, nombre_rol) VALUES (3, 'Cliente')");

    // Modificaciones en usuarios (Admin y Operario)
    const [userCols] = await pool.query("SHOW COLUMNS FROM usuarios");
    const userColNames = userCols.map(c => c.Field);
    if (!userColNames.includes('correo')) {
      await pool.query("ALTER TABLE usuarios ADD COLUMN correo VARCHAR(150) NOT NULL UNIQUE");
    }
    if (!userColNames.includes('contrasena')) {
      await pool.query("ALTER TABLE usuarios ADD COLUMN contrasena VARCHAR(255) NOT NULL");
    }

    // Modificaciones en clientes (Ajuste para Login y Registro)
    const [clientCols] = await pool.query("SHOW COLUMNS FROM clientes");
    const clientColNames = clientCols.map(c => c.Field);
    if (!clientColNames.includes('identificacion')) {
      await pool.query("ALTER TABLE clientes ADD COLUMN identificacion VARCHAR(50) NOT NULL UNIQUE");
    }
    if (!clientColNames.includes('correo')) {
      await pool.query("ALTER TABLE clientes ADD COLUMN correo VARCHAR(150) NOT NULL UNIQUE");
    }
    if (!clientColNames.includes('contrasena')) {
      await pool.query("ALTER TABLE clientes ADD COLUMN contrasena VARCHAR(255) NOT NULL");
    }

    console.log(' Base de datos verificada y adaptada correctamente.');
  } catch (error) {
    console.error('❌ Error inicializando modificaciones de DB:', error.message);
  }
};

// Verificación inicial de la conexión al arrancar el servidor
const verificarConexion = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('===================================================');
    console.log(' Conexión exitosa a la base de datos MySQL.');
    console.log('===================================================');
    connection.release();
    
    // Si la conexión es exitosa, procedemos con las modificaciones
    await initDbModifications();
  } catch (error) {
    console.error('===================================================');
    console.error(' ERROR CRÍTICO: No se pudo conectar a MySQL.');
    console.error(' Verifique que el servicio XAMPP/MySQL esté activo.');
    console.error(' Detalle:', error.message);
    console.log('===================================================');
  }
};

// Arrancar el proceso de verificación
verificarConexion();

// Se exporta 'pool' que ya maneja promesas directamente gracias a 'mysql2/promise'
module.exports = pool;