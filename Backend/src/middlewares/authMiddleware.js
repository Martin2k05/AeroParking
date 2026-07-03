const jwt = require('jsonwebtoken');

// ==========================================
// 1. MIDDLEWARE PARA VERIFICAR EL TOKEN JWT
// ==========================================
const verificarToken = (req, res, next) => {
  // Capturar el header Authorization de la petición HTTP
  const tokenHeader = req.headers['authorization'];

  if (!tokenHeader) {
    return res.status(403).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    // Extraer el token de forma flexible (soporta tanto "Bearer <token>" como "<token>" directo)
    const token = tokenHeader.split(' ')[1] || tokenHeader;
    
    // Verificar y decodificar el token usando la clave secreta del entorno (.env)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inyectar el payload decodificado (id, correo, rol) en la petición para los siguientes pasos
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('❌ Error al validar token en authMiddleware:', error.message);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

// ==========================================
// 2. MIDDLEWARE PARA CONTROL DE ACCESO POR ROLES
// ==========================================
const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Validar preventivamente que req.user exista y que su rol esté dentro de la lista permitida
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso.' });
    }
    next();
  };
};

module.exports = { verificarToken, permitirRoles };