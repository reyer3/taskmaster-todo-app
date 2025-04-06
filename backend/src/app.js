/**
 * Configuración principal de la aplicación Express
 * 
 * Este archivo configura la aplicación Express, middleware y rutas
 */
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const { errorHandler } = require('./infrastructure/middlewares/error.middleware');
const { requestLogger } = require('./infrastructure/middlewares/logger.middleware');
const { eventTypes } = require('./infrastructure/events');
const { SystemEvents } = eventTypes;

// Importar rutas
const authRoutes = require('./api/auth/auth.controller');
const tasksRoutes = require('./api/tasks/task.controller');
const realtimeRoutes = require('./api/realtime/realtime.controller');
const notificationRoutes = require('./api/notifications/notification.controller');

// Crear aplicación Express
const app = express();

// Configurar middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Middleware para inyectar componentes en el objeto request
app.use((req, res, next) => {
  // Obtener componentes desde la aplicación
  const components = app.get('components');
  if (components) {
    req.components = components;
    req.events = components.events;
    
    // Añadir hook para cerrar conexiones al final de la solicitud en entorno serverless
    if (process.env.VERCEL) {
      res.on('finish', async () => {
        try {
          // No cerramos la conexión completa, solo liberamos recursos si es necesario
          // En un entorno serverless, las conexiones persistentes son importantes
        } catch (error) {
          console.error('Error al liberar recursos:', error);
        }
      });
    }
  }
  next();
});

// Configurar rutas base
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta de verificación de salud
app.get('/health', async (req, res) => {
  const healthInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    // Incluir información adicional si está disponible
    eventsEnabled: !!(req.events && req.events.publisher),
    webSocketsEnabled: !!(req.components && req.components.websockets && req.components.websockets.enabled)
  };

  res.status(200).json(healthInfo);

  // Publicar evento de health check si los eventos están disponibles
  if (req.events && req.events.publisher) {
    await req.events.publisher.publish(SystemEvents.HEALTH_CHECK, healthInfo);
  }
});

// Middleware para rutas no encontradas
// Middleware para rutas no encontradas
app.all('*', async (req, res) => {
  const notFoundError = {
    status: 'error',
    message: `Ruta no encontrada: ${req.originalUrl}`
  };

  res.status(404).json(notFoundError);

  // Registrar el error como evento si está disponible
  if (req.events && req.events.publisher) {
    void req.events.publisher.publish(SystemEvents.ERROR, {
      type: 'NotFound',
      path: req.originalUrl,
      method: req.method
    });
  }
});

// Middleware de manejo de errores global
app.use(errorHandler);

module.exports = app;
