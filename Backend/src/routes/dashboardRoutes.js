const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

// Ruta para el panel de administración y control operativo
router.get('/monitoreo', verificarToken, permitirRoles('Admin', 'Operario'), dashboardController.getOperarioAdminDashboard);

// Ruta para el estado del plan del cliente (Maneja el estado 200 para evitar caídas)
router.get('/cliente', verificarToken, permitirRoles('Cliente'), dashboardController.getClienteDashboard);

// Ruta para la información básica del perfil del cliente
router.get('/perfil-cliente', verificarToken, permitirRoles('Cliente'), dashboardController.getPerfilCliente);

module.exports = router;