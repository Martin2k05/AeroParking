// Dentro de la sección de tu webhook donde verificas que el pago fue exitoso ('approved'):
try {
  // CORRECCIÓN: Extraemos de forma real el external_reference desde los datos que envía Mercado Pago
  // Como lo guardamos como un String en la ruta POST, lo convertimos a entero con Number()
  const idCliente = Number(req.body.data.external_reference);

  if (!idCliente) {
    return res.status(400).json({ message: 'No se recibió la referencia del cliente.' });
  }

  // 1. Obtener la placa del cliente de manera dinámica desde la base de datos
  const [cliente] = await db.query('SELECT placa_vehiculo FROM clientes WHERE id_cliente = ?', [idCliente]);
  
  if (cliente.length === 0) {
    return res.status(404).json({ message: 'El cliente no existe en la base de datos.' });
  }
  
  const placaCliente = cliente[0].placa_vehiculo;

  // Calcular las fechas exactas para la mensualidad (30 días de cobertura)
  const fechaInicio = new Date();
  const fechaFinal = new Date();
  fechaFinal.setDate(fechaFinal.getDate() + 30);

  // 2. Insertar con la placa real del cliente que ya existe en la base de datos
  await db.query(
    `INSERT INTO mensualidades (id_cliente, placa_vehiculo, id_usuario, fecha_inicio, fecha_final) 
     VALUES (?, ?, 1, ?, ?)`,
    [idCliente, placaCliente, fechaInicio, fechaFinal]
  );

  console.log(`Mensualidad activada con éxito para el cliente ID: ${idCliente} y Placa: ${placaCliente}`);

} catch (error) {
  console.error('Error al procesar la inserción de la mensualidad en el webhook:', error);
}