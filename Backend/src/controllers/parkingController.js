const db = require('../config/db');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// =========================================================================
// ⚠️ MANO: PEGA TU TOKEN AQUÍ ADENTRO DE LAS COMILLAS SIMPLES
// Debe verse algo así como: const API_TOKEN = '9a8b7c6d5e4f3210...';
// =========================================================================
const API_TOKEN = '7b7475e3f9743f84bd4ba096fd12a34d94b2d34f'; 

// ==========================================
// 1. RECONOCIMIENTO AUTOMÁTICO (ALPR)
// ==========================================
exports.leerPlaca = [upload.single('foto'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No se recibió imagen." });
  
  try {
    const formData = new FormData();
    formData.append('upload', fs.createReadStream(req.file.path));

    const response = await axios.post('https://api.platerecognizer.com/v1/plate-reader/', formData, {
      headers: { 
        'Authorization': `Token ${API_TOKEN}`,
        ...formData.getHeaders() 
      }
    });

    // Borramos el archivo temporal
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    if (response.data.results && response.data.results.length > 0) {
      return res.json({ placa: response.data.results[0].plate.toUpperCase() });
    } else {
      return res.status(404).json({ message: "No se detectó ninguna placa clara." });
    }
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("DETALLE DEL ERROR DE IA:", error.response ? error.response.data : error.message);
    return res.status(500).json({ message: "Error en IA", detalle: error.message });
  }
}];

// ==========================================
// 2. REGISTRAR INGRESO VEHICULAR
// ==========================================
exports.registrarIngreso = async (req, res) => {
  const { placaVehiculo, tipoVehiculo } = req.body;
  const idUsuarioActivo = req.user ? req.user.id : 1; 

  try {
    if (!placaVehiculo || !tipoVehiculo) {
      return res.status(400).json({ message: 'La placa y el tipo de vehículo son requeridos.' });
    }

    const ident = placaVehiculo.toUpperCase().trim();
    
    if (tipoVehiculo === 'Bicicleta') {
      if (ident.length < 10 || ident.length > 12) {
        return res.status(400).json({ message: 'El ID de bicicleta debe tener entre 10 y 12 caracteres.' });
      }
    } else {
      if (ident.length !== 6) {
        return res.status(400).json({ message: 'La placa debe tener exactamente 6 caracteres.' });
      }
    }

    const [duplicados] = await db.query(
      'SELECT id_control_i_s FROM control_i_s WHERE placa_vehiculo = ? AND hora_salida IS NULL',
      [ident]
    );

    if (duplicados.length > 0) {
      return res.status(400).json({ message: 'Error: Este vehículo ya se encuentra dentro.' });
    }

    const [tarifa] = await db.query('SELECT id_tarifa FROM tarifas WHERE tipo_vehiculo = ? LIMIT 1', [tipoVehiculo]);
    if (tarifa.length === 0) {
      return res.status(404).json({ message: 'Tipo de vehículo no configurado.' });
    }
    const idTarifa = tarifa[0].id_tarifa;

    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [ident]);

    await db.query(
      `INSERT INTO control_i_s (placa_vehiculo, id_tarifa, id_usuario, hora_ingreso, fecha_ingreso) 
       VALUES (?, ?, ?, NOW(), CURDATE())`,
      [ident, idTarifa, idUsuarioActivo]
    );
    
    res.status(201).json({ message: 'Ingreso registrado exitosamente.' });
  } catch (error) {
    console.error("❌ ERROR EN INGRESO:", error);
    res.status(500).json({ message: 'Error interno en el ingreso.' });
  }
};

// ==========================================
// 3. REGISTRAR SALIDA Y LIQUIDACIÓN (CORREGIDO CON TU BD)
// ==========================================
exports.registrarSalida = async (req, res) => {
  const { placaVehiculo, metodoPago } = req.body;
  if (!placaVehiculo) return res.status(400).json({ message: 'Placa obligatoria.' });

  const ident = placaVehiculo.toUpperCase().trim();
  const now = new Date();

  try {
    // 1. Verificar si el vehículo se encuentra activo dentro del parqueadero
    const [registros] = await db.query(`
      SELECT c.id_control_i_s, c.hora_ingreso, t.tipo_vehiculo, t.valor_primera_hora, t.valor_hora_2_a_12
      FROM control_i_s c
      JOIN tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.placa_vehiculo = ? AND c.hora_salida IS NULL`, [ident]);

    if (registros.length === 0) return res.status(404).json({ message: 'Vehículo no encontrado activo.' });

    const registro = registros[0];
    let totalAPagar = 0;
    let esMensual = false;

    // 2. CONSULTA ADAPTADA A TU MER: Revisa si la placa tiene una mensualidad vigente hoy
    const [planActivo] = await db.query(`
      SELECT id_mensualidad FROM mensualidades 
      WHERE placa_vehiculo = ? 
        AND CURDATE() BETWEEN fecha_inicio AND fecha_final`, [ident]);

    if (planActivo.length > 0) {
      // Si tiene una mensualidad vigente, el costo es de $0 automáticamente
      totalAPagar = 0;
      esMensual = true;
    } else {
      // Si no tiene mensualidad, se calcula la tarifa normal por tiempo de estadía
      const diffMs = now - new Date(registro.hora_ingreso);
      const diffMinutos = Math.max(1, Math.round(diffMs / 60000));
      
      totalAPagar = (registro.tipo_vehiculo === 'Bicicleta') 
        ? 700 
        : (Math.ceil(diffMinutos / 60) * registro.valor_primera_hora);
    }

    // 3. Registrar la salida en la tabla control_i_s
    await db.query(
      'UPDATE control_i_s SET hora_salida = ?, fecha_salida = CURDATE(), calculo_tarifa = ? WHERE id_control_i_s = ?',
      [now, totalAPagar, registro.id_control_i_s]
    );

    // 4. Si el cobro es mayor a cero se ingresa el registro a la tabla de pagos
    if (totalAPagar > 0) {
      await db.query('INSERT INTO pagos (id_control_i_s, metodo_pago) VALUES (?, ?)', [registro.id_control_i_s, metodoPago || 'Efectivo']);
    }

// 5. Enviar respuesta estructurada para el frontend 
    res.json({ 
      message: esMensual 
        ? `Cliente Mensual Activo: Salida registrada sin cobro ($0) para la placa ${ident}` 
        : `Salida procesada. Total: $${totalAPagar}`, 
      totalCobrado: totalAPagar,
      esMensual: esMensual 
    });
  } catch (error) {
    console.error("❌ ERROR EN SALIDA:", error);
    res.status(500).json({ message: 'Error interno en salida.', detalle: error.message });
  }
};

// ==========================================
// 4. LISTAR VEHÍCULOS ACTIVOS
// ==========================================
exports.listarVehiculosDentro = async (req, res) => {
  try {
    const [vehiculos] = await db.query(`
      SELECT c.id_control_i_s, c.placa_vehiculo, t.tipo_vehiculo, c.hora_ingreso
      FROM control_i_s c JOIN tarifas t ON c.id_tarifa = t.id_tarifa WHERE c.hora_salida IS NULL`);
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar.' });
  }
};

// ==========================================
// 5. ELIMINAR REGISTRO (Corrección)
// ==========================================
exports.eliminarRegistro = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM control_i_s WHERE id_control_i_s = ?', [id]);
    res.json({ message: 'Registro eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar.' });
  }
};

// ==========================================
// 6. HISTORIAL DE SALIDAS
// ==========================================
exports.obtenerHistorial = async (req, res) => {
  try {
    const [historial] = await db.query(`
      SELECT c.placa_vehiculo, c.fecha_salida, c.hora_salida, c.calculo_tarifa, t.tipo_vehiculo 
      FROM control_i_s c
      JOIN tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.hora_salida IS NOT NULL 
      ORDER BY c.fecha_salida DESC`);
    res.json(historial);
  } catch (error) {
    console.error("❌ ERROR EN HISTORIAL:", error);
    res.status(500).json({ message: 'Error al consultar historial.' });
  }
};