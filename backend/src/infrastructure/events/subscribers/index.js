/**
 * Inicialización de suscriptores de eventos
 * 
 * Este archivo configura y exporta los suscriptores disponibles
 */
const { NotificationSubscriber } = require('./notification-subscriber');

/**
 * Inicializa todos los suscriptores de eventos
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Instancias de suscriptores
 */
function initializeSubscribers(options = {}) {
  console.log('🚀 Inicializando suscriptores de eventos...');
  
  // Crear instancias de suscriptores
  const notificationSubscriber = new NotificationSubscriber({
    emailService: options.emailService,
    enabled: options.enableNotifications !== false
  });
  
  // Inicializar cada suscriptor
  notificationSubscriber.initialize();
  
  // Función para cerrar todos los suscriptores
  const disposeAll = () => {
    console.log('Cerrando suscriptores de eventos...');
    notificationSubscriber.dispose();
  };
  
  return {
    notificationSubscriber,
    disposeAll
  };
}

module.exports = {
  NotificationSubscriber,
  initializeSubscribers
};
