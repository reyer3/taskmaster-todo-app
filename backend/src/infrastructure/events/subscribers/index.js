/**
 * Inicialización de suscriptores de eventos
 * 
 * Este archivo configura y exporta los suscriptores disponibles
 */
const { NotificationSubscriber } = require('./notification-subscriber');
const { EmailNotificationSubscriber } = require('./email-notification-subscriber');

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
  
  const emailNotificationSubscriber = new EmailNotificationSubscriber({
    emailService: options.emailService,
    enabled: options.enableEmailNotifications !== false
  });
  
  // Inicializar cada suscriptor
  notificationSubscriber.initialize();
  emailNotificationSubscriber.initialize();
  
  // Función para cerrar todos los suscriptores
  const disposeAll = () => {
    console.log('Cerrando suscriptores de eventos...');
    notificationSubscriber.dispose();
    emailNotificationSubscriber.dispose();
  };
  
  return {
    notificationSubscriber,
    emailNotificationSubscriber,
    disposeAll
  };
}

module.exports = {
  NotificationSubscriber,
  EmailNotificationSubscriber,
  initializeSubscribers
};
