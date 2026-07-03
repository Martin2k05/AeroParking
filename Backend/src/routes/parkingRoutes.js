const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

// ==========================================
// RUTAS OPERATIVAS DEL PARQUEADERO
// ==========================================

// --- Registro de Entradas y Salidas ---
// Resuelve: POST /api/parking/ingreso
router.post('/ingreso', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.registrarIngreso);
// Resuelve: POST /api/parking/salida
router.post('/salida', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.registrarSalida);

// --- Listado de Vehículos Activos (Soporta ambas variantes del Front) ---
// ⚠️ SOLUCIÓN AL 404: Mapea la URL exacta que está pidiendo el cliente en los logs
router.get('/activos', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.listarVehiculosDentro);
// Conserva el alias original por si otra vista del proyecto lo usa
router.get('/vehiculos-activos', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.listarVehiculosDentro);

// --- Módulo OCR (Lectura de Placas con Inteligencia Artificial) ---
// Se añade verificación de token para evitar que agentes externos inyecten peticiones a la API de Plate Recognizer
router.post('/leer-placa', verificarToken, permitirRoles('Admin', 'Operario'), parkingController.leerPlaca);

module.exports = router;