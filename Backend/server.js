// ==========================================
// CONFIGURACIÓN E IMPORTACIONES GLOBALES
// ==========================================
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// Importaciones de enrutadores unificados
const authRoutes = require('./src/routes/authRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes'); // 🟢 ¡AQUÍ!: Importamos tus rutas de Mercado Pago

const app = express();

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());

// Middleware de rastreo (Log de peticiones en consola)
app.use((req, res, next) => {
  console.log(`[RASTREO AERO PARKING] => Método: ${req.method} | URL Solicitada: ${req.url}`);
  next();
});

// ==========================================
// DECLARACIÓN DE RUTAS DE LA API (ENDPOINT BASE)
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ==========================================
// CONTROL DE RUTA NO MAPEADA (MANEJO 404)
// ==========================================
app.use((req, res) => {
  console.warn(`[ALERTA 404] El frontend intentó entrar a una ruta no mapeada: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Ruta no encontrada en el ecosistema AeroParking.' });
});

// ==========================================
// INICIALIZACIÓN DEL PUERTO Y ENCENDIDO
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('===================================================');
  console.log(`🚀 Servidor AeroParking corriendo en el puerto ${PORT}`);
  console.log('📡 Ecosistema de rutas operativo y escuchando peticiones.');
  console.log('===================================================');
});