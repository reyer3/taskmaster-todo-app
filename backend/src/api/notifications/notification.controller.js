/**
 * Controlador para endpoints de notificaciones
 *
 * Este módulo implementa la API REST para gestionar notificaciones
 * y preferencias de notificación de los usuarios.
 *
 * @module api/notifications/notification.controller
 */
const express = require('express');
const router = express.Router();
const { NotificationService } = require('../../services/notification.service');
const { NotificationRepository } = require('../../infrastructure/repositories/notification.repository');
const { NotificationPreferenceRepository } = require('../../infrastructure/repositories/notification-preference.repository');
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');
const { AppError } = require('../../utils/errors/app-error');

// Crear instancias de repositorios
const notificationRepository = new NotificationRepository();
const preferenceRepository = new NotificationPreferenceRepository();

/**
 * Obtiene una instancia del servicio de notificaciones con componentes de la aplicación
 *
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @returns {NotificationService} Instancia del servicio de notificaciones
 */
const getNotificationService = (req) => {
  const components = req.app.get('components');

  return new NotificationService(
    notificationRepository,
    preferenceRepository,
    {
      socketServer: components?.websockets?.socketServer,
      eventPublisher: components?.events?.publisher
    }
  );
};

/**
 * Obtiene las notificaciones del usuario autenticado
 *
 * @route GET /api/notifications
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express para middleware
 * @returns {Promise<void>}
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const service = getNotificationService(req);

    // Opciones de filtrado desde query params
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      onlyUnread: req.query['unread'] === 'true',
      types: req.query.types ? req.query.types.split(',') : [],
      sortDirection: req.query.sort === 'asc' ? 'asc' : 'desc'
    };
    const result = await service.getUserNotifications(userId, options);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    // Pasar el error al middleware de manejo de errores
    next(error);
  }
});

/**
 * Obtiene el conteo de notificaciones no leídas
 *
 * @route GET /api/notifications/unread-count
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const count = await notificationRepository.countUnread(userId);

  res.json({
    status: 'success',
    data: { count }
  });
});

/**
 * Marca una notificación específica como leída
 *
 * @route POST /api/notifications/mark-read/:id
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.post('/mark-read/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  const service = getNotificationService(req);

  const notification = await service.markAsRead(notificationId, userId);

  res.json({
    status: 'success',
    data: notification.toDTO(),
    message: 'Notificación marcada como leída'
  });
});

/**
 * Marca una notificación específica como leída (ruta alternativa con PATCH)
 *
 * @route PATCH /api/notifications/:id/read
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express para middleware
 * @returns {Promise<void>}
 */
router.patch('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const service = getNotificationService(req);

    const notification = await service.markAsRead(notificationId, userId);

    res.json({
      status: 'success',
      data: notification,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    // Pasar el error al middleware de manejo de errores
    next(error);
  }
});

/**
 * Marca todas las notificaciones del usuario como leídas
 *
 * @route POST /api/notifications/mark-all-read
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.post('/mark-all-read', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const service = getNotificationService(req);
  const { ids } = req.body; // Opcional: array de IDs específicos

  const count = await service.markAllAsRead(userId, ids || []);

  res.json({
    status: 'success',
    data: { count },
    message: `Se marcaron ${count} notificaciones como leídas`
  });
});

/**
 * Marca todas las notificaciones del usuario como leídas (ruta alternativa con PATCH)
 *
 * @route PATCH /api/notifications/read-all
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.patch('/read-all', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const service = getNotificationService(req);
  const { ids } = req.body; // Opcional: array de IDs específicos

  const count = await service.markAllAsRead(userId, ids || []);

  res.json({
    status: 'success',
    data: { count },
    message: `Se marcaron ${count} notificaciones como leídas`
  });
});

/**
 * Elimina una notificación específica
 *
 * @route DELETE /api/notifications/:id
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express para middleware
 * @returns {Promise<void>}
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const service = getNotificationService(req);

    await service.deleteNotification(notificationId, userId);

    // Cambiamos el status code a 204 (No Content)
    res.status(204).end();
  } catch (error) {
    // Pasar el error al middleware de manejo de errores
    next(error);
  }
});

/**
 * Elimina todas las notificaciones del usuario (por defecto solo las leídas)
 *
 * @route DELETE /api/notifications
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.delete('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const service = getNotificationService(req);
  const onlyRead = req.query.onlyRead !== 'false'; // Por defecto solo elimina leídas

  const count = await service.deleteAllNotifications(userId, { onlyRead });

  res.json({
    status: 'success',
    data: { count },
    message: `Se eliminaron ${count} notificaciones`
  });
});

/**
 * Obtiene las preferencias de notificaciones del usuario
 *
 * @route GET /api/notifications/preferences
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.get('/preferences', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const service = getNotificationService(req);

  const preferences = await service.getUserPreferences(userId);

  res.json({
    status: 'success',
    data: preferences
  });
});

/**
 * Actualiza las preferencias de notificaciones del usuario
 *
 * @route PUT /api/notifications/preferences
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express para middleware
 * @returns {Promise<void>}
 */
router.put('/preferences', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    const service = getNotificationService(req);

    // Validar el formato de las actualizaciones
    validatePreferenceUpdates(updates);

    const preferences = await service.updateUserPreferences(userId, updates);

    res.json({
      status: 'success',
      data: preferences,
      message: 'Preferencias actualizadas correctamente'
    });
  } catch (error) {
    // Pasar el error al middleware de manejo de errores
    next(error);
  }
});

/**
 * Envía una notificación de prueba al usuario autenticado
 *
 * @route POST /api/notifications/test
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.post('/test', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const service = getNotificationService(req);

  // Crear una notificación de prueba
  const notification = await service.createNotification(
    userId,
    'system.test',
    {
      title: 'Notificación de prueba',
      message: 'Esta es una notificación de prueba',
      timestamp: new Date().toISOString()
    }
  );

  res.json({
    status: 'success',
    data: notification ? notification.toDTO() : null,
    message: 'Notificación de prueba enviada'
  });
});

/**
 * Válida el formato de las actualizaciones de preferencias
 *
 * @param {Object} updates - Objeto con las actualizaciones de preferencias
 * @throws {AppError} Si alguna de las actualizaciones no es válida
 */
function validatePreferenceUpdates(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new AppError('Las actualizaciones deben ser un objeto válido', 400);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No se han especificado actualizaciones', 400);
  }

  // Verificar que todos los valores sean booleanos
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== 'boolean') {
      throw new AppError(`El valor para '${key}' debe ser un booleano`, 400);
    }
  }
}

module.exports = router;
