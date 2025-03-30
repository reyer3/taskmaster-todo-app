/**
 * Sistema de publicación de eventos
 * 
 * Este módulo implementa un patrón publisher/subscriber que permite
 * a los componentes de la aplicación comunicarse de forma desacoplada
 * a través de eventos.
 */

class EventPublisher {
  constructor() {
    this.subscribers = new Map();
    this.middlewares = [];
  }

  /**
   * Registra un suscriptor para un tipo de evento específico
   * @param {string} eventType - Tipo de evento
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    // Retornar función para cancelar suscripción
    return () => {
      if (this.subscribers.has(eventType)) {
        this.subscribers.get(eventType).delete(callback);
        
        // Si no quedan suscriptores, eliminar el tipo de evento
        if (this.subscribers.get(eventType).size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Añade middleware para procesar eventos antes de entregarlos
   * @param {Function} middleware - Función (event) => event o null para cancelar
   * @returns {void}
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Publica un evento para todos los suscriptores interesados
   * @param {string} eventType - Tipo de evento
   * @param {Object} payload - Datos asociados al evento
   * @returns {Promise<void>}
   */
  async publish(eventType, payload = {}) {
    // Crear objeto de evento
    let event = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Aplicar middlewares en orden
    for (const middleware of this.middlewares) {
      event = middleware(event);
      // Si un middleware devuelve null, cancelar el evento
      if (event === null) return;
    }

    // Si no hay suscriptores para este tipo, terminar
    if (!this.subscribers.has(eventType)) {
      return;
    }

    // Notificar a los suscriptores de forma asíncrona
    const subscribers = this.subscribers.get(eventType);
    const promises = Array.from(subscribers).map(callback => {
      try {
        return Promise.resolve(callback(event));
      } catch (error) {
        console.error(`Error en suscriptor de evento ${eventType}:`, error);
        return Promise.resolve(); // Evitar que un error rompa la cadena
      }
    });

    // Esperar a que todos los suscriptores procesen el evento
    await Promise.all(promises);
  }

  /**
   * Elimina todas las suscripciones
   * @returns {void}
   */
  clear() {
    this.subscribers.clear();
  }
}

// Instancia singleton para toda la aplicación
const eventPublisher = new EventPublisher();

module.exports = {
  EventPublisher,
  eventPublisher, // Exportar la instancia singleton
};
