const db = require('../config/db');

// Obtener todos los clientes registrados
exports.obtenerClientes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_cliente, nombre_cliente, identificacion, correo, telefono, dir_barrio, dir_calle, dir_carrera, dir_numero, placa_vehiculo 
       FROM clientes 
       ORDER BY id_cliente DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return res.status(500).json({ message: 'Error interno al obtener el listado de clientes.' });
  }
};

// Eliminar un cliente por ID
exports.eliminarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    
    return res.json({ message: 'Cliente eliminado correctamente del sistema.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({ message: 'No se puede eliminar el cliente porque tiene registros asociados.' });
  }
};

// Obtener todos los reportes generados
exports.obtenerReportes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id_reporte, r.tipo_reporte, r.periodo_reporte, r.fecha_generado, u.nombre_usuario 
       FROM reportes r 
       JOIN usuarios u ON r.id_usuario = u.id_usuario 
       ORDER BY r.id_reporte DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return res.status(500).json({ message: 'Error interno al obtener el listado de reportes.' });
  }
};

// Crear/Registrar la generación de un nuevo reporte
exports.crearReporte = async (req, res) => {
  const idUsuario = req.user.id; 
  const { tipo_reporte, periodo_reporte } = req.body;

  if (!tipo_reporte || !periodo_reporte) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    await db.query(
      `INSERT INTO reportes (id_usuario, tipo_reporte, periodo_reporte) VALUES (?, ?, ?)`,
      [idUsuario, tipo_reporte, periodo_reporte]
    );
    return res.status(201).json({ message: 'Reporte generado y guardado correctamente.' });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    return res.status(500).json({ message: 'Error interno al procesar el reporte.' });
  }
};

// Obtener todas las tarifas registradas
exports.obtenerTarifas = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tarifas ORDER BY id_tarifa ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    return res.status(500).json({ message: 'Error interno al obtener las tarifas.' });
  }
};

// Actualizar los valores de una tarifa específica
exports.actualizarTarifa = async (req, res) => {
  const idUsuario = req.user.id;
  const { id } = req.params;
  const { 
    valor_primera_hora, 
    valor_hora_2_a_12, 
    valor_hora_13_a_168, 
    valor_hora_169_mas, 
    valor_mensualidad, 
    normativa 
  } = req.body;

  try {
    await db.query(
      `UPDATE tarifas 
       SET id_usuario = ?,
           valor_primera_hora = ?, 
           valor_hora_2_a_12 = ?, 
           valor_hora_13_a_168 = ?, 
           valor_hora_169_mas = ?, 
           valor_mensualidad = ?, 
           normativa = ?
       WHERE id_tarifa = ?`,
      [
        idUsuario, 
        valor_primera_hora, 
        valor_hora_2_a_12, 
        valor_hora_13_a_168, 
        valor_hora_169_mas, 
        valor_mensualidad, 
        normativa || 'Resolución Aeropuerto', 
        id
      ]
    );
    return res.json({ message: 'Tarifa configurada y actualizada con éxito.' });
  } catch (error) {
    console.error('Error al actualizar tarifa:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la tarifa.' });
  }
};

// Obtener métricas, estadísticas y datos de gráficos para el Dashboard dinámico
// Obtener métricas, estadísticas y datos de gráficos para el Dashboard dinámico
// Obtener métricas, estadísticas y datos de gráficos para el Dashboard dinámico
exports.obtenerMetricasDashboard = async (req, res) => {
  try {
    const totalCupos = 100;
    
    // Capturamos los filtros que vienen del frontend por la URL (?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD)
    const { fechaInicio, fechaFin } = req.query;

    // Ajustamos los filtros dinámicos basados en la fecha de ingreso/movimiento
    const filtroIngresosYGraficos = (fechaInicio && fechaFin) 
      ? `DATE(c.hora_salida) BETWEEN ? AND ?` 
      : `DATE(c.hora_salida) = CURDATE()`;
      
    const filtroOcupacionHora = (fechaInicio && fechaFin)
      ? `DATE(hora_ingreso) BETWEEN ? AND ?`
      : `fecha_ingreso = CURDATE()`;

    // Parámetros para pasarle a las queries que dependan del filtro
    const paramsFiltro = (fechaInicio && fechaFin) ? [fechaInicio, fechaFin] : [];

    // 1. Ocupación en Tiempo Real
    const [rowsOcupados] = await db.query(
      `SELECT COUNT(*) as ocupados FROM control_i_s WHERE hora_salida IS NULL`
    );
    const ocupados = rowsOcupados[0].ocupados;
    const disponibles = Math.max(0, totalCupos - ocupados);

    // 2. Ingresos del periodo seleccionado (Suma de los pagos recaudados en el rango de fecha)
    const [rowsIngresosHoy] = await db.query(
      `SELECT IFNULL(SUM(c.calculo_tarifa), 0.00) as ingresos_hoy 
       FROM control_i_s c
       INNER JOIN pagos p ON c.id_control_i_s = p.id_control_i_s
       WHERE ${filtroIngresosYGraficos}`,
      paramsFiltro
    );
    const ingresosHoy = rowsIngresosHoy[0].ingresos_hoy;

    // 3. Clientes Activos
    const [rowsClientes] = await db.query(
      `SELECT COUNT(*) as total_clientes FROM clientes`
    );
    const clientesActivos = rowsClientes[0].total_clientes;

    // 4. Planes por Vencer
    const [rowsVencer] = await db.query(
      `SELECT COUNT(*) as por_vencer FROM mensualidades WHERE fecha_final BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 5 DAY)`
    );
    const planesPorVencer = rowsVencer[0].por_vencer;

    // 5. Actividad Reciente (Mantiene el INNER JOIN con tarifas para la gráfica de pastel)
    const queryActividad = (fechaInicio && fechaFin)
      ? `SELECT c.placa_vehiculo, c.hora_ingreso, c.hora_salida, c.calculo_tarifa, t.tipo_vehiculo
         FROM control_i_s c
         INNER JOIN tarifas t ON c.id_tarifa = t.id_tarifa
         WHERE DATE(c.hora_ingreso) BETWEEN ? AND ? OR DATE(c.hora_salida) BETWEEN ? AND ?
         ORDER BY c.id_control_i_s DESC LIMIT 5`
      : `SELECT c.placa_vehiculo, c.hora_ingreso, c.hora_salida, c.calculo_tarifa, t.tipo_vehiculo
         FROM control_i_s c
         INNER JOIN tarifas t ON c.id_tarifa = t.id_tarifa
         ORDER BY c.id_control_i_s DESC LIMIT 5`;
         
    const paramsActividad = (fechaInicio && fechaFin) ? [fechaInicio, fechaFin, fechaInicio, fechaFin] : [];
    const [actividadReciente] = await db.query(queryActividad, paramsActividad);

    // =====================================================================
    // DATA PARA GRÁFICOS DINÁMICOS
    // =====================================================================

    // A. Gráfico Ocupación por Hora
    const [rowsGraficoOcupacion] = await db.query(
      `SELECT DATE_FORMAT(hora_ingreso, '%H:00') as hora, COUNT(*) as vehiculos
       FROM control_i_s
       WHERE ${filtroOcupacionHora}
       GROUP BY DATE_FORMAT(hora_ingreso, '%H:00')
       ORDER BY MIN(hora_ingreso) ASC`,
      paramsFiltro
    );

    // B. Gráfico Ingresos Semanales (Restaurado con 'dia' y 'total' para Recharts)
    const querySemanales = (fechaInicio && fechaFin)
      ? `SELECT 
            CASE DAYOFWEEK(c.hora_salida)
              WHEN 1 THEN 'Dom' WHEN 2 THEN 'Lun' WHEN 3 THEN 'Mar'
              WHEN 4 THEN 'Mié' WHEN 5 THEN 'Jue' WHEN 6 THEN 'Vie' WHEN 7 THEN 'Sáb'
            END as dia,
            IFNULL(SUM(c.calculo_tarifa), 0) as total
         FROM control_i_s c
         INNER JOIN pagos p ON c.id_control_i_s = p.id_control_i_s
         WHERE DATE(c.hora_salida) BETWEEN ? AND ?
         GROUP BY CASE DAYOFWEEK(c.hora_salida)
                    WHEN 1 THEN 'Dom' WHEN 2 THEN 'Lun' WHEN 3 THEN 'Mar'
                    WHEN 4 THEN 'Mié' WHEN 5 THEN 'Jue' WHEN 6 THEN 'Vie' WHEN 7 THEN 'Sáb'
                  END
         ORDER BY MIN(c.hora_salida) ASC`
      : `SELECT 
            CASE DAYOFWEEK(c.hora_salida)
              WHEN 1 THEN 'Dom' WHEN 2 THEN 'Lun' WHEN 3 THEN 'Mar'
              WHEN 4 THEN 'Mié' WHEN 5 THEN 'Jue' WHEN 6 THEN 'Vie' WHEN 7 THEN 'Sáb'
            END as dia,
            IFNULL(SUM(c.calculo_tarifa), 0) as total
         FROM control_i_s c
         INNER JOIN pagos p ON c.id_control_i_s = p.id_control_i_s
         WHERE c.hora_salida >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)
         GROUP BY CASE DAYOFWEEK(c.hora_salida)
                    WHEN 1 THEN 'Dom' WHEN 2 THEN 'Lun' WHEN 3 THEN 'Mar'
                    WHEN 4 THEN 'Mié' WHEN 5 THEN 'Jue' WHEN 6 THEN 'Vie' WHEN 7 THEN 'Sáb'
                  END
         ORDER BY FIELD(dia, 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom')`;

    const [rowsGraficoSemanales] = await db.query(querySemanales, paramsFiltro);

    // Enviamos el paquete completo al frontend
    return res.json({
      metricas: {
        totalCupos,
        ocupados,
        disponibles,
        ingresosHoy, 
        clientesActivos,
        planesPorVencer
      },
      graficoOcupacion: rowsGraficoOcupacion,
      graficoIngresos: rowsGraficoSemanales,
      actividadReciente
    });

  } catch (error) {
    console.log("============== CRASH EN DASHBOARD ==============");
    console.error(error); 
    console.log("================================================");
    
    return res.status(500).json({ 
      message: 'Error interno en el servidor.',
      error: error.message,
      stack: error.stack 
    });
  }
};

// Asegúrate de que el nombre coincida letra por letra con tu archivo de rutas
exports.actualizarPlacaCliente = async (req, res) => {
  const { id } = req.params;
  const { placa_vehiculo } = req.body;

  if (!placa_vehiculo) {
    return res.status(400).json({ message: 'La placa es obligatoria.' });
  }

  try {
    const placaLimpia = placa_vehiculo.trim().toUpperCase();
    
    // 1. Asegurar que la placa exista en la tabla de vehículos
    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaLimpia]);

    // 2. Actualizar la placa en el registro del cliente
    const [result] = await db.query(
      'UPDATE clientes SET placa_vehiculo = ? WHERE id_cliente = ?',
      [placaLimpia, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    return res.json({ message: 'Placa del cliente actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar placa del cliente:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la placa.' });
  }
};

// ==========================================
// CONTROLADORES DE OPERADORES
// ==========================================

// Obtener todos los operadores registrados (Rol Operario)
// 1. OBTENER OPERADORES (Filtrando para que NO salga el admin)
exports.obtenerOperadores = async (req, res) => {
    try {
        // Filtramos por id_rol = 2 para traer solo operarios y excluir al admin (id_rol = 1)
        const sql = `SELECT id_usuario, nombre_usuario, correo, id_rol 
                     FROM usuarios 
                     WHERE id_rol = 2
                     ORDER BY id_usuario DESC`;
        
        const [resultado] = await db.query(sql);
        res.status(200).json(resultado);
    } catch (error) {
        console.error("Error al obtener operadores:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// 2. ELIMINAR OPERADOR (Corrigiendo la columna en el WHERE)
exports.eliminarOperador = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `DELETE FROM usuarios WHERE id_usuario = ? AND id_rol = 2`;
        
        const [resultado] = await db.query(sql, [id]);
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: "Operador no encontrado o no autorizado" });
        }
        
        res.status(200).json({ message: "Operador eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar operador:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// Registrar un nuevo operador en el sistema
exports.crearOperador = async (req, res) => {
  const { nombre_usuario, identificacion, correo, telefono, contrasena } = req.body;

  if (!nombre_usuario || !identificacion || !correo || !contrasena) {
    return res.status(400).json({ message: 'Los campos Nombre, Identificación, Correo y Contraseña son obligatorios.' });
  }

  try {
    // Verificar si ya existe un usuario con esa identificación o correo
    const [existente] = await db.query(
      'SELECT id_usuario FROM usuarios WHERE identificacion = ? OR correo = ?',
      [identificacion, correo]
    );

    if (existente.length > 0) {
      return res.status(400).json({ message: 'Ya existe un usuario registrado con esa identificación o correo electrónico.' });
    }

    // Insertar el nuevo operador (Asignamos el rol 'Operario' directamente)
    await db.query(
      `INSERT INTO usuarios (nombre_usuario, identificacion, correo, telefono, contrasena, rol) 
       VALUES (?, ?, ?, ?, ?, 'Operario')`,
      [nombre_usuario, identificacion, correo, telefono || null, contrasena]
    );

    return res.status(201).json({ message: 'Operador registrado correctamente en el sistema.' });
  } catch (error) {
    console.error('Error al crear operador:', error);
    return res.status(500).json({ message: 'Error interno al procesar el registro del operador.' });
  }
};

// Actualizar los datos de un operador específico
exports.actualizarOperador = async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, identificacion, correo, telefono } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE usuarios 
       SET nombre_usuario = ?, identificacion = ?, correo = ?, telefono = ? 
       WHERE id_usuario = ? AND rol = 'Operario'`,
      [nombre_usuario, identificacion, correo, telefono || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Operador no encontrado o no cuentas con los permisos.' });
    }

    return res.json({ message: 'Datos del operador actualizados con éxito.' });
  } catch (error) {
    console.error('Error al actualizar operador:', error);
    return res.status(500).json({ message: 'Error interno al actualizar la información del operador.' });
  }
};