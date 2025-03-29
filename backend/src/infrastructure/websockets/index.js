/**
 * Módulo principal de WebSockets
 * 
 * Este archivo exporta las clases y funciones necesarias para
 * implementar comunicación en tiempo real usando Socket.IO
 */
const { SocketServer } = require('./socket-server');
const { RealtimeNotificationSubscriber } = require('./realtime-notification-subscriber');

/**
 * Inicializa el sistema de WebSockets
 * @param {Object} httpServer - Servidor HTTP de Node.js
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Sistema de WebSockets
 */
const initializeWebSockets = (httpServer, options = {}) => {
  // Verificar si las notificaciones en tiempo real están habilitadas
  const enabled = options.enabled !== false;
  
  if (!enabled) {
    console.log('ℹ️ Notificaciones en tiempo real deshabilitadas');
    return {
      enabled: false,
      subscriber: null,
      socketServer: null,
      shutdown: async () => {}
    };
  }

  // Crear servidor Socket.IO
  const socketServer = new SocketServer(httpServer, {
    jwtSecret: options.jwtSecret || process.env.JWT_SECRET,
    corsOrigin: options.corsOrigin || process.env.CORS_ORIGIN,
    eventPublisher: options.eventPublisher
  });
  
  // Inicializar servidor
  socketServer.initialize();
  
  // Crear suscriptor de notificaciones en tiempo real
  const realtimeSubscriber = new RealtimeNotificationSubscriber({
    socketServer,
    enabled
  });
  
  // Inicializar suscriptor
  realtimeSubscriber.initialize();
  
  // Función para cierre limpio
  const shutdown = async () => {
    console.log('Cerrando sistema de WebSockets...');
    realtimeSubscriber.dispose();
    await socketServer.close();
    console.log('✅ Sistema de WebSockets cerrado');
  };
  
  return {
    enabled,
    socketServer,
    subscriber: realtimeSubscriber,
    shutdown
  };
};

module.exports = {
  SocketServer,
  RealtimeNotificationSubscriber,
  initializeWebSockets
};
