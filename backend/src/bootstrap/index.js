/**
 * Módulo de inicialización de la aplicación
 * 
 * Este módulo se encarga de inicializar todos los componentes
 * necesarios para el funcionamiento de la aplicación.
 */
const { PrismaClient } = require('@prisma/client');
const { initializeEventSystem, eventTypes } = require('../infrastructure/events');
const { SystemEvents } = eventTypes;
const { NotificationRepository } = require('../infrastructure/repositories/notification.repository');
const { NotificationPreferenceRepository } = require('../infrastructure/repositories/notification-preference.repository');
const { NotificationService } = require('../services/notification.service');

/**
 * Inicializa los componentes de la aplicación
 * @param {Object} options - Opciones de configuración
 * @param {Object} server - Servidor HTTP (para WebSockets)
 * @returns {Object} Instancias inicializadas
 */
async function bootstrap(options = {}, server = null) {
  console.log('🚀 Iniciando componentes de la aplicación...');
  
  // Inicializar sistema de eventos primero para poder registrar eventos durante el arranque
  const events = initializeEventSystem({
    verbose: options.verboseEvents || process.env.NODE_ENV === 'development',
    enableNotifications: options.enableNotifications !== false
  });
  console.log('✅ Sistema de eventos inicializado');
  
  // Inicializar conexión a base de datos
  // En entorno serverless, usamos la misma instancia de Prisma para todas las solicitudes
  // para optimizar conexiones
  const prisma = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    // Configuración optimizada para entorno serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
  }

  try {
    // Verificar la conexión a la base de datos haciendo una consulta simple
    await prisma.$queryRaw`SELECT 1+1 AS result`;
    console.log('✅ Conexión a la base de datos establecida');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    // Publicar evento de error y cerrar sistema de eventos
    await events.publisher.publish(SystemEvents.ERROR, {
      type: 'DatabaseConnectionError',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    await events.shutdown();
    throw error;
  }

  // Variable para el sistema de WebSockets, se inicializará si hay servidor HTTP
  let websockets = null;

  // Si se proporciona un servidor HTTP, inicializar WebSockets
  if (server) {
    const { initializeWebSockets } = require('../infrastructure/websockets');
    websockets = initializeWebSockets(server, {
      enabled: options.enableWebSockets !== false,
      jwtSecret: options.jwtSecret || process.env.JWT_SECRET,
      corsOrigin: options.corsOrigin || process.env.CORS_ORIGIN,
      eventPublisher: events.publisher
    });
    
    if (websockets.enabled) {
      console.log('✅ Sistema de WebSockets inicializado');
    }
  }

  // Inicializar servicio de notificaciones
  const notificationRepository = new NotificationRepository();
  const notificationPreferenceRepository = new NotificationPreferenceRepository();
  const notificationService = new NotificationService(
    notificationRepository,
    notificationPreferenceRepository,
    {
      socketServer: websockets?.socketServer,
      eventPublisher: events.publisher
    }
  );

  // Configurar intervalo de limpieza de notificaciones antiguas (cada 24 horas)
  let notificationCleanupInterval = null;
  let initialCleanupTimeout = null;
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
  
  if (options.enableNotificationCleanup !== false) {
    console.log('🧹 Configurando limpieza automática de notificaciones...');
    
    // Ejecutar la limpieza inicial después de 5 minutos del arranque
    initialCleanupTimeout = setTimeout(async () => {
      try {
        const deletedCount = await notificationService.cleanupNotifications({
          olderThan: 30, // días
          onlyRead: true
        });
        console.log(`✅ Limpieza inicial de notificaciones: ${deletedCount} eliminadas`);
      } catch (error) {
        console.error('❌ Error en limpieza inicial de notificaciones:', error);
      }
    }, 5 * 60 * 1000);
    
    // Configurar limpieza periódica
    notificationCleanupInterval = setInterval(async () => {
      try {
        const deletedCount = await notificationService.cleanupNotifications({
          olderThan: 30, // días
          onlyRead: true
        });
        console.log(`✅ Limpieza periódica de notificaciones: ${deletedCount} eliminadas`);
      } catch (error) {
        console.error('❌ Error en limpieza periódica de notificaciones:', error);
      }
    }, CLEANUP_INTERVAL);
  }

  // Publicar evento de inicio del sistema
  await events.publisher.publish(SystemEvents.STARTUP, {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    webSocketsEnabled: websockets?.enabled || false
  });

  // Función para cierre ordenado
  const shutdown = async () => {
    console.log('Cerrando componentes de la aplicación...');
    
    // Limpiar intervalos y timeouts
    if (notificationCleanupInterval) {
      clearInterval(notificationCleanupInterval);
    }
    
    if (initialCleanupTimeout) {
      clearTimeout(initialCleanupTimeout);
    }
    
    // Publicar evento de cierre
    await events.publisher.publish(SystemEvents.SHUTDOWN, {
      timestamp: new Date().toISOString(),
    });
    
    // Cerrar WebSockets si están habilitados
    if (websockets && websockets.shutdown) {
      await websockets.shutdown();
    }
    
    // Cerrar sistema de eventos
    await events.shutdown();
    
    // Desconectar base de datos
    await prisma.$disconnect();
    console.log('✅ Componentes cerrados correctamente');
  };

  return {
    prisma,
    events,
    websockets,
    notificationService,
    shutdown,
  };
}

module.exports = { bootstrap };
