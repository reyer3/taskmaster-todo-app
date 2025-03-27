/**
 * Middleware para autenticación y protección de rutas
 */
const { AuthService } = require('../../services/AuthService');
const { UserRepository } = require('../repositories/UserRepository');

// Crear instancias de repositorio y servicio
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

/**
 * Middleware que verifica el token JWT y añade el usuario a la request
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verificar y decodificar el token
    const decoded = authService.verifyToken(token);
    
    // Añadir información del usuario a la request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware que verifica si el usuario tiene rol de administrador
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 */
const adminMiddleware = (req, res, next) => {
  // El authMiddleware debe ejecutarse primero
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
