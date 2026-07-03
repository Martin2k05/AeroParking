const db = require('../config/db');

exports.capturarPagoExitoso = async (req, res) => {
  // Mercado Pago te suele devolver datos por query o por body según si es Webhook o Redirect
  // Aquí capturas el id del cliente y la placa (puedes mandarlos en el external_reference de Mercado Pago)
  const { id_cliente, placa_vehiculo } = req.body; 

  try {
    if (!id_cliente || !placa_vehiculo) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para activar la mensualidad.' });
    }

    const placaFormateada = placa_vehiculo.trim().toUpperCase().substring(0, 10);

    // 1. Asegurar que el vehículo exista en la tabla global de vehículos
    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaFormateada]);

    // 2. Buscar un usuario/operario interno para la llave foránea (para que no se estalle)
    const [primerUsuario] = await db.query('SELECT id_usuario FROM usuarios LIMIT 1');
    const idUsuarioAsignar = primerUsuario.length > 0 ? primerUsuario[0].id_usuario : 1;

    // 3. ACTIVACIÓN REAL: Insertar la mensualidad con vigencia de 30 días en el futuro
    await db.query(
      `INSERT INTO mensualidades (id_cliente, placa_vehiculo, id_usuario, fecha_inicio, fecha_final) 
       VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [id_cliente, placaFormateada, idUsuarioAsignar]
    );

    console.log(`¡Mensualidad activada con éxito para el cliente ${id_cliente} y placa ${placaFormateada}!`);
    
    return res.status(200).json({ message: 'Pago procesado y plan activado correctamente.' });

  } catch (error) {
    console.error('Error al activar la mensualidad tras el pago:', error);
    return res.status(500).json({ message: 'Error interno al activar la membresía.' });
  }
};