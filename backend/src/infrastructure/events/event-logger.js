/**
 * Middleware y suscriptor para registrar eventos
 *
 * Este módulo se encarga de registrar eventos para depuración y auditoria.
 */
const { eventPublisher } = require('./event-publisher');

class EventLogger {
  /**
   * Inicializa el logger de eventos
   * @param {Object} options - Opciones de configuración
   * @param {boolean} options.verbose - Si es true, registra todos los eventos con detalles
   */
  constructor(options = { verbose: false }) {
    this.verbose = options.verbose;
    this.initialize();
  }

  /**
   * Inicializa el logger, suscribiéndose a todos los eventos
   */
  initialize() {
    // Middleware para registrar todos los eventos
    eventPublisher.use((event) => {
      if (this.verbose) {
        console.log(`[EVENT] ${event.type}:`, JSON.stringify(event.payload, null, 2));
      } else {
        console.log(`[EVENT] ${event.type} at ${event.timestamp}`);
      }
      return event; // Importante: devolver el evento para que continúe la cadena
    });

    // Suscribirse específicamente a eventos de error para registrarlos en detalle
    eventPublisher.subscribe('system.error', (event) => {
      console.error(`[ERROR EVENT] ${event.type}:`, event.payload);
    });
  }
}

module.exports = { EventLogger };
