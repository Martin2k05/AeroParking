const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const paymentController = require('../controllers/paymentController');
const { verificarToken } = require('../middlewares/authMiddleware');

// 📦 Importamos Mercado Pago para este archivo de rutas
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Inicializamos el cliente con tus credenciales reales
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-2666026075230997-052508-8ac9febd57b8bff50c507b7b5fa9deb5-3425962506' 
});

// ==========================================
// SOLICITUD DE PREFERENCIA MP (Movido y Corregido)
// ==========================================
router.post('/comprar-plan-mensual', verificarToken, async (req, res) => {
  const idCliente = req.user.id;

  try {
    const [clienteRows] = await db.query(
      'SELECT nombre_cliente, correo, placa_vehiculo FROM clientes WHERE id_cliente = ?', 
      [idCliente]
    );
    
    if (clienteRows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    
    const cliente = clienteRows[0];
    let placaReal = cliente.placa_vehiculo ? cliente.placa_vehiculo : 'ABC123_M';

    await db.query('INSERT IGNORE INTO vehiculos (placa_vehiculo) VALUES (?)', [placaReal]);

    const partesNombre = cliente.nombre_cliente.trim().split(/\s+/);
    const primerNombre = partesNombre[0] || 'Cliente';
    const apellido = partesNombre.slice(1).join(' ') || 'AeroParking';

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: 'plan-mensual-01',
            title: 'Plan Mensual AeroParking',
            quantity: 1,
            unit_price: 180000, 
            currency_id: 'COP'
          }
        ],
        payer: {
          name: primerNombre,
          surname: apellido,
          email: cliente.correo,
        },
        payment_methods: {
          included_payment_types: [{ id: 'bank_transfer' }], // Fuerza a que liste PSE / Bancos
          installments: 1
        },
        back_urls: {
          success: 'http://localhost:3000/mi-plan?payment=success',
          failure: 'http://localhost:3000/mi-plan?payment=failure',
          pending: 'http://localhost:3000/mi-plan?payment=pending'
        },
        // Guardamos la metadata clave en external_reference para cuando configures el webhook de respuesta
        external_reference: JSON.stringify({ id_cliente: idCliente, placa_vehiculo: placaReal })
      }
    });

    if (response && response.init_point) {
      return res.json({ urlPago: response.init_point });
    } else {
      throw new Error('La respuesta de Mercado Pago no generó la propiedad init_point.');
    }

  } catch (error) {
    console.error('Error detallado al generar preferencia MP:', error);
    res.status(500).json({ message: 'No se pudo generar el canal de pago PSE real.', error: error.message });
  }
});

// Endpoint para procesar la confirmación del pago exitoso
router.post('/mercadopago-success', verificarToken, paymentController.capturarPagoExitoso);

module.exports = router;