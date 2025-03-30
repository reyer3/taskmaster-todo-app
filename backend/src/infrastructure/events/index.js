/**
 * Punto de entrada para el sistema de eventos
 */
const { EventPublisher, eventPublisher } = require('./event-publisher');
const { EventLogger } = require('./event-logger');
const eventTypes = require('./event-types');
const { initializeSubscribers } = require('./subscribers');

/**
 * Inicializa el sistema de eventos
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Sistema de eventos
 */
const initializeEventSystem = (options = {}) => {
  // Crear y configurar el logger de eventos
  const eventLogger = new EventLogger({
    verbose: options.verbose || process.env.NODE_ENV === 'development',
  });
  
  // Inicializar suscriptores
  const subscribers = initializeSubscribers(options);

  const eventSystem = {
    publisher: eventPublisher,
    logger: eventLogger,
    types: eventTypes,
    subscribers,
    // Método para cerrar limpiamente el sistema de eventos
    shutdown: async () => {
      if (subscribers && subscribers.disposeAll) {
        subscribers.disposeAll();
      }
      // Limpiar el publisher si es necesario
      eventPublisher.clear();
    }
  };

  return eventSystem;
};

module.exports = {
  EventPublisher,
  eventPublisher,
  EventLogger,
  initializeEventSystem,
  eventTypes,
};
