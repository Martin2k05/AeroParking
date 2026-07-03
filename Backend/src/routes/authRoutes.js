const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); 
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Configuración de Mercado Pago SDK
const { MercadoPagoConfig } = require('mercadopago');
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-2666026075230997-052508-8ac9febd57b8bff50c507b7b5fa9deb5-3425962506' 
});

// ==========================================
// 1. RUTAS DE ACCESO PÚBLICO (LOGIN Y REGISTRO)
// ==========================================

// --- Login Alias ---
router.post('/login', authController.login);
router.post('/auth/login', authController.login);
router.post('/api/auth/login', authController.login);

// --- Registro Clientes Alias ---
router.post('/registro', authController.registerCliente);
router.post('/auth/registro', authController.registerCliente);
router.post('/api/auth/registro', authController.registerCliente);
router.post('/register', authController.registerCliente);
router.post('/auth/register', authController.registerCliente);
router.post('/api/auth/register', authController.registerCliente);

// --- Registro Operadores (Interno) ---
router.post('/register-operador', async (req, res) => {
  const { nombre_usuario, correo, contrasena, id_rol } = req.body;
  
  if (!contrasena) {
    return res.status(400).json({ message: "La contraseña es obligatoria." });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    await db.query(
      'INSERT INTO usuarios (nombre_usuario, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)',
      [nombre_usuario, correo, hash, id_rol]
    );
    res.status(201).json({ message: 'Operador creado correctamente.' });
  } catch (err) {
    console.error('❌ Error en register-operador:', err);
    res.status(500).json({ message: 'Error al crear el operador.' });
  }
});

// ==========================================
// 2. RUTAS PROTEGIDAS (REQUIEREN VERIFICAR TOKEN)
// ==========================================

// --- Perfil del Cliente (GET) ---
router.get('/perfil-cliente', verificarToken, authController.obtenerPerfil);
router.get('/auth/perfil-cliente', verificarToken, authController.obtenerPerfil);
router.get('/api/auth/perfil-cliente', verificarToken, authController.obtenerPerfil);
router.get('/perfil', verificarToken, authController.obtenerPerfil);
router.get('/auth/perfil', verificarToken, authController.obtenerPerfil);
router.get('/api/auth/perfil', verificarToken, authController.obtenerPerfil);
router.get('/api/dashboard/perfil-cliente', verificarToken, authController.obtenerPerfil);

// --- Actualizar Perfil (PUT) ---
router.put('/actualizar-perfil', verificarToken, authController.actualizarPerfil);
router.put('/auth/actualizar-perfil', verificarToken, authController.actualizarPerfil);
router.put('/api/auth/actualizar-perfil', verificarToken, authController.actualizarPerfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.put('/auth/perfil', verificarToken, authController.actualizarPerfil);
router.put('/api/auth/perfil', verificarToken, authController.actualizarPerfil);

// --- Cambiar Contraseña (PUT) ---
router.put('/cambiar-password', verificarToken, authController.cambiarContrasena);
router.put('/auth/cambiar-password', verificarToken, authController.cambiarContrasena);
router.put('/api/auth/cambiar-password', verificarToken, authController.cambiarContrasena);
router.put('/cambiar-contrasena', verificarToken, authController.cambiarContrasena);
router.put('/auth/cambiar-contrasena', verificarToken, authController.cambiarContrasena);
router.put('/api/auth/cambiar-contrasena', verificarToken, authController.cambiarContrasena);

module.exports = router;