/**
 * Controlador para endpoints de autenticación
 */
const express = require('express');
const router = express.Router();
const { AuthService } = require('../../services/auth.service');
const { UserRepository } = require('../../infrastructure/repositories/user.repository');
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');

// Crear instancias de repositorio y servicio
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

// Registro de nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({
        message: 'Email, password and name are required'
      });
    }
    
    const result = await authService.register({ email, password, name });
    
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('already registered')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }
    
    const result = await authService.login(email, password);
    
    res.json(result);
  } catch (error) {
    // Mismo código de error para credenciales incorrectas o cuenta deshabilitada
    // por razones de seguridad
    res.status(401).json({ message: error.message });
  }
});

// Obtener perfil del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Actualizar perfil de usuario
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) updates.email = email;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'At least one field to update is required'
      });
    }
    
    const user = await authService.updateUser(req.user.id, updates);
    res.json(user);
  } catch (error) {
    if (error.message.includes('already in use')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

// Cambiar contraseña
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }
    
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.message.includes('incorrect')) {
      return res.status(401).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
