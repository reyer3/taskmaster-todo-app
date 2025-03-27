/**
 * Configuración principal de la aplicación Express
 * 
 * Este archivo configura la aplicación Express, middleware y rutas
 */
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./infrastructure/middlewares/error.middleware');
const { requestLogger } = require('./infrastructure/middlewares/logger.middleware');

// Importar rutas
const authRoutes = require('./api/auth/auth.routes');
const tasksRoutes = require('./api/tasks/tasks.routes');

// Crear aplicación Express
const app = express();

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Configurar rutas base
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

// Ruta de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: `Ruta no encontrada: ${req.originalUrl}` 
  });
});

// Middleware de manejo de errores global
app.use(errorHandler);

module.exports = app;
