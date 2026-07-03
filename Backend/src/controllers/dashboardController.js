const db = require('../config/db');

// ==========================================
// 1. DASHBOARD DE OPERARIO Y ADMINISTRADOR
// ==========================================
exports.getOperarioAdminDashboard = async (req, res) => {
  try {
    const totalCuposConstante = 100;

    // Ocupación actual y flujo del día
    const [[{ ocupados }]] = await db.query('SELECT COUNT(*) AS ocupados FROM control_i_s WHERE hora_salida IS NULL');
    const disponibles = Math.max(0, totalCuposConstante - ocupados);
    const [[{ ingresosHoy }]] = await db.query('SELECT COUNT(*) AS ingresosHoy FROM control_i_s WHERE fecha_ingreso = CURDATE()');
    
    // Clientes activos y planes desde la tabla 'mensualidades'
    const [[{ clientesActivos }]] = await db.query('SELECT COUNT(DISTINCT id_cliente) AS clientesActivos FROM mensualidades WHERE fecha_final >= CURDATE()');
    const [[{ planesPorVencer }]] = await db.query(`SELECT COUNT(*) AS planesPorVencer FROM mensualidades WHERE fecha_final BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);

    // Ocupación por hora (Consulta real en BD mapeada de forma segura)
    const [ocupacionRaw] = await db.query('SELECT HOUR(hora_ingreso) as hora, COUNT(*) as vehiculos FROM control_i_s WHERE fecha_ingreso = CURDATE() GROUP BY HOUR(hora_ingreso)');
    const horasFijos = [6, 9, 12, 15, 18, 21];
    
    const ocupacionPorHora = horasFijos.map(h => {
      const horaFormateada = h < 10 ? `0${h}:00` : `${h}:00`;
      return {
        hora: horaFormateada,
        vehiculos: ocupacionRaw.find(r => r.hora === h)?.vehiculos || 0
      };
    });

    // 🛠️ SOLUCIÓN TOTAL: Calculamos el Lunes de esta semana usando JavaScript local (Evita desfases de MySQL)
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana; 
    
    const lunesEstaSemana = new Date(hoy);
    lunesEstaSemana.setDate(hoy.getDate() + diferenciaLunes);
    
    // Formateamos la fecha obtenida a 'YYYY-MM-DD' de forma limpia
    const fechaLunesString = lunesEstaSemana.toISOString().split('T')[0];

    // Enviamos la fecha calculada directamente como parámetro (?) a la consulta SQL
    const [ingresosRaw] = await db.query(`
      SELECT WEEKDAY(fecha_ingreso) as num_dia, COUNT(*) as total 
      FROM control_i_s 
      WHERE fecha_ingreso >= ? 
      GROUP BY WEEKDAY(fecha_ingreso)
    `, [fechaLunesString]);
    
    const diasNombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const ingresosSemanales = diasNombres.map((nombre, index) => ({
      dia: nombre,
      ingresos: parseInt(ingresosRaw.find(r => r.num_dia === index)?.total || 0, 10)
    }));

    // Actividad reciente (Muestra los últimos movimientos con el evento y la fecha/hora formateada)
    const [actividadReciente] = await db.query(`
      SELECT 
        placa_vehiculo, 
        CASE WHEN hora_salida IS NULL THEN 'Entrada' ELSE 'Salida' END as tipo_movimiento,
        CONCAT(fecha_ingreso, ' ', TIME(COALESCE(hora_salida, hora_ingreso))) AS fecha_formateada
      FROM control_i_s 
      ORDER BY id_control_i_s DESC 
      LIMIT 5
    `);

    // Respuesta estructurada compatible con ambos Frontends
    res.json({
      metricas: { 
        totalCupos: totalCuposConstante, 
        ocupados, 
        disponibles, 
        ingresosHoy, 
        clientesActivos, 
        planesPorVencer 
      },
      ocupacionPorHora, 
      ingresosSemanales, 
      actividadReciente
    });

  } catch (error) {
    console.error("❌ Error en getOperarioAdminDashboard:", error);
    res.status(500).json({ message: 'Error interno al cargar los datos del dashboard comercial.' });
  }
};

// ==========================================
// 2. DASHBOARD EXCLUSIVO DEL CLIENTE
// ==========================================
exports.getClienteDashboard = async (req, res) => {
  const idCliente = req.user.id; // Proveniente del middleware de autenticación

  try {
    // Buscamos de emergencia la placa nativa registrada en su cuenta de cliente
    const [clienteFila] = await db.query(
      'SELECT placa_vehiculo FROM clientes WHERE id_cliente = ?',
      [idCliente]
    );
    
    let placaBaseDeDatos = 'No Registrada';
    if (clienteFila.length > 0 && clienteFila[0].placa_vehiculo) {
      const placaLimpia = clienteFila[0].placa_vehiculo.toString().trim();
      if (placaLimpia !== 'NULL' && placaLimpia !== 'null' && placaLimpia !== '') {
        placaBaseDeDatos = placaLimpia;
      }
    }

    // Consultar si tiene compras/mensualidades reales
    const [plan] = await db.query(
      'SELECT m.*, DATEDIFF(m.fecha_final, CURDATE()) AS dias_restantes FROM mensualidades m WHERE m.id_cliente = ? ORDER BY m.id_mensualidad DESC LIMIT 1',
      [idCliente]
    );

    // Si el cliente es nuevo y NUNCA ha comprado una mensualidad
    if (plan.length === 0) {
      return res.status(200).json({
        planActual: 'NINGUNO',
        diasRestantes: 0,
        placaVehiculo: placaBaseDeDatos, 
        validoHasta: 'N/A'
      });
    }

    const infoPlan = plan[0];
    const diasRestantesCalculados = infoPlan.dias_restantes ? Math.max(0, infoPlan.dias_restantes) : 0;
    const esVigente = diasRestantesCalculados > 0;

    // Si hay mensualidad, priorizamos la placa del plan; si no viene ahí, usamos la del cliente
    let placaRespuesta = infoPlan.placa_vehiculo || placaBaseDeDatos;
    if (placaRespuesta === 'NULL' || placaRespuesta === 'null' || placaRespuesta.toString().trim() === '') {
      placaRespuesta = placaBaseDeDatos;
    }

    return res.status(200).json({
      planActual: esVigente ? 'PREMIUM' : 'NINGUNO',
      diasRestantes: diasRestantesCalculados,
      placaVehiculo: placaRespuesta, 
      validoHasta: esVigente && infoPlan.fecha_final ? infoPlan.fecha_final : 'N/A'
    });

  } catch (error) {
    console.error('❌ Error al consultar información del dashboard cliente:', error);
    return res.status(500).json({ message: 'Error al consultar información del cliente.' });
  }
};

// ==========================================
// 3. OBTENER PERFIL COMPLETO DEL CLIENTE
// ==========================================
exports.getPerfilCliente = async (req, res) => {
  const idCliente = req.user.id;

  try {
    // Traer la información del perfil del cliente
    const [data] = await db.query(
      `SELECT 
        id_cliente, 
        nombre_cliente, 
        correo, 
        identificacion, 
        telefono, 
        dir_calle, 
        dir_carrera, 
        dir_numero, 
        dir_barrio,
        placa_vehiculo
       FROM clientes WHERE id_cliente = ?`, 
      [idCliente]
    );
    
    if (data.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    const cliente = data[0];

    // Buscamos complementariamente si tiene una placa registrada en la tabla de mensualidades
    const [vehiculos] = await db.query(
      'SELECT placa_vehiculo FROM mensualidades WHERE id_cliente = ? ORDER BY id_mensualidad DESC LIMIT 1', 
      [idCliente]
    );
    
    // Evaluamos de forma segura cuál placa usar y limpiamos valores nulos de strings
    let placaFinal = 'Sin Placa';
    
    if (vehiculos.length > 0 && vehiculos[0].placa_vehiculo) {
      placaFinal = vehiculos[0].placa_vehiculo.toString().trim();
    } else if (cliente.placa_vehiculo) {
      placaFinal = cliente.placa_vehiculo.toString().trim();
    }

    if (placaFinal === 'NULL' || placaFinal === 'null' || placaFinal === '') {
      placaFinal = 'Sin Placa';
    }
    
    // Enviamos la respuesta estructurada y limpia de nulos al Front
    res.json({
      nombre_cliente: cliente.nombre_cliente,
      correo: cliente.correo,
      identificacion: cliente.identificacion,
      telefono: cliente.telefono || '',
      dir_calle: cliente.dir_calle || '',
      dir_carrera: cliente.dir_carrera || '',
      dir_numero: cliente.dir_numero || '',
      dir_barrio: cliente.dir_barrio || '',
      placa_vehiculo: placaFinal
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil del cliente:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};