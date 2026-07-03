const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { verificarToken } = require('../middlewares/authMiddleware');

// ==========================================
// RUTAS PROTEGIDAS PARA GESTIÓN DE CLIENTES
// ==========================================
router.get('/clientes', verificarToken, adminController.obtenerClientes);
router.put('/clientes/:id/placa', verificarToken, adminController.actualizarPlacaCliente);
router.delete('/clientes/:id', verificarToken, adminController.eliminarCliente);


// ==========================================
// 🚀 RUTAS PROTEGIDAS PARA GESTIÓN DE OPERADORES
// ==========================================
router.get('/operadores', verificarToken, adminController.obtenerOperadores);
router.post('/operadores', verificarToken, adminController.crearOperador);
router.put('/operadores/:id', verificarToken, adminController.actualizarOperador);
router.delete('/operadores/:id', verificarToken, adminController.eliminarOperador);


// ==========================================
// RUTAS PROTEGIDAS PARA GESTIÓN DE REPORTES
// ==========================================
router.get('/reportes', verificarToken, adminController.obtenerReportes);
router.post('/reportes', verificarToken, adminController.crearReporte);


// ==========================================
// RUTAS PROTEGIDAS PARA GESTIÓN DE TARIFAS
// ==========================================
router.get('/tarifas', verificarToken, adminController.obtenerTarifas);
router.put('/tarifas/:id', verificarToken, adminController.actualizarTarifa);


// ==========================================
// RUTA PROTEGIDA PARA EL DASHBOARD
// ==========================================
router.get('/dashboard/metricas', verificarToken, adminController.obtenerMetricasDashboard);

module.exports = router;