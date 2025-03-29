/**
 * Controlador para endpoints relacionados con WebSockets y tiempo real
 * 
 * Este módulo implementa APIs para verificar el estado de las conexiones
 * WebSocket y enviar notificaciones en tiempo real a usuarios.
 * 
 * @module api/realtime/realtime.controller
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');

/**
 * Verifica el estado de las conexiones WebSocket
 * 
 * @route GET /api/realtime/status
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {void}
 */
router.get('/status', (req, res) => {
  const components = req.app.get('components');
  const websockets = components?.websockets;
  
  // Verificar si WebSockets está habilitado
  const enabled = !!(websockets && websockets.enabled);
  
  // Si está habilitado, obtener métricas básicas
  let metrics = {
    enabled,
    timestamp: new Date().toISOString()
  };
  
  if (enabled && websockets.socketServer) {
    const socketServer = websockets.socketServer;
    
    // Añadir métricas disponibles
    metrics = {
      ...metrics,
      connectedUsers: socketServer.userSockets.size,
      status: 'online',
    };
  }
  
  res.json({
    status: 'success',
    data: metrics
  });
});

/**
 * Envía una notificación en tiempo real a un usuario específico
 * 
 * @route POST /api/realtime/notify-user
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {void}
 */
router.post('/notify-user', authMiddleware, (req, res) => {
  // En un sistema real, habría que verificar si el usuario es administrador
  // Por ahora, simplemente permitimos a cualquier usuario autenticado
  
  const { userId, eventName, data } = req.body;
  
  if (!userId || !eventName) {
    return res.status(400).json({
      status: 'error',
      message: 'Se requiere el ID de usuario y el nombre del evento'
    });
  }
  
  const components = req.app.get('components');
  const websockets = components?.websockets;
  
  // Verificar si WebSockets está habilitado
  if (!websockets || !websockets.enabled || !websockets.socketServer) {
    return res.status(503).json({
      status: 'error',
      message: 'El sistema de WebSockets no está disponible'
    });
  }
  
  // Intentar enviar la notificación
  const sent = websockets.socketServer.emitToUser(userId, eventName, {
    ...data,
    sentBy: req.user.id,
    timestamp: new Date().toISOString()
  });
  
  if (sent) {
    res.json({
      status: 'success',
      message: `Notificación enviada a usuario ${userId}`
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'No se pudo enviar la notificación'
    });
  }
});

/**
 * Envía una notificación a todos los usuarios conectados
 * 
 * @route POST /api/realtime/broadcast
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {void}
 */
router.post('/broadcast', authMiddleware, (req, res) => {
  // En un sistema real, habría que verificar si el usuario es administrador
  
  const { eventName, data } = req.body;
  
  if (!eventName) {
    return res.status(400).json({
      status: 'error',
      message: 'Se requiere el nombre del evento'
    });
  }
  
  const components = req.app.get('components');
  const websockets = components?.websockets;
  
  // Verificar si WebSockets está habilitado
  if (!websockets || !websockets.enabled || !websockets.socketServer) {
    return res.status(503).json({
      status: 'error',
      message: 'El sistema de WebSockets no está disponible'
    });
  }
  
  // Intentar enviar la notificación a todos
  const sent = websockets.socketServer.emitToAll(eventName, {
    ...data,
    sentBy: req.user.id,
    timestamp: new Date().toISOString()
  });
  
  if (sent) {
    res.json({
      status: 'success',
      message: 'Notificación enviada a todos los usuarios conectados'
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'No se pudo enviar la notificación'
    });
  }
});

module.exports = router;
