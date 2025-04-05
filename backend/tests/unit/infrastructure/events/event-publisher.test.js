/**
 * Pruebas unitarias para el sistema de publicación de eventos (Publisher/Subscriber)
 */
const { EventPublisher } = require('../../../../src/infrastructure/events/event-publisher');

describe('EventPublisher', () => {
  let eventPublisher;

  beforeEach(() => {
    // Crear una nueva instancia para cada test
    eventPublisher = new EventPublisher();
  });

  describe('subscribe', () => {
    it('debería registrar un suscriptor correctamente', () => {
      // Datos de prueba
      const eventType = 'test.event';
      const callback = jest.fn();
      
      // Ejecución del método
      const unsubscribe = eventPublisher.subscribe(eventType, callback);
      
      // Verificaciones
      expect(eventPublisher.subscribers.has(eventType)).toBe(true);
      expect(eventPublisher.subscribers.get(eventType).size).toBe(1);
      expect(typeof unsubscribe).toBe('function');
    });

    it('debería permitir múltiples suscriptores para el mismo evento', () => {
      // Datos de prueba
      const eventType = 'test.event';
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      // Ejecución del método
      eventPublisher.subscribe(eventType, callback1);
      eventPublisher.subscribe(eventType, callback2);
      
      // Verificaciones
      expect(eventPublisher.subscribers.get(eventType).size).toBe(2);
    });

    it('debería retornar una función para cancelar la suscripción', () => {
      // Datos de prueba
      const eventType = 'test.event';
      const callback = jest.fn();
      
      // Ejecución del método
      const unsubscribe = eventPublisher.subscribe(eventType, callback);
      unsubscribe();
      
      // Verificaciones - El suscriptor debe haberse eliminado
      expect(eventPublisher.subscribers.has(eventType)).toBe(false);
    });
  });

  describe('publish', () => {
    it('debería notificar a todos los suscriptores de un evento', async () => {
      // Datos de prueba
      const eventType = 'test.event';
      const payload = { data: 'test-data' };
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      // Suscribir callbacks
      eventPublisher.subscribe(eventType, callback1);
      eventPublisher.subscribe(eventType, callback2);
      
      // Publicar evento
      await eventPublisher.publish(eventType, payload);
      
      // Verificaciones
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      
      // Verificar argumentos pasados a los callbacks
      const expectedEvent = {
        type: eventType,
        payload,
        timestamp: expect.any(String)
      };
      
      expect(callback1).toHaveBeenCalledWith(expectedEvent);
      expect(callback2).toHaveBeenCalledWith(expectedEvent);
    });

    it('no debería hacer nada si no hay suscriptores para el tipo de evento', async () => {
      // Datos de prueba
      const eventType = 'test.event';
      const callback = jest.fn();
      
      // Suscribir a un evento diferente
      eventPublisher.subscribe('other.event', callback);
      
      // Publicar evento
      await eventPublisher.publish(eventType, { data: 'test' });
      
      // Verificaciones
      expect(callback).not.toHaveBeenCalled();
    });

    it('debería aplicar middlewares a los eventos antes de entregarlos', async () => {
      // Datos de prueba
      const eventType = 'test.event';
      const payload = { data: 'test-data' };
      const callback = jest.fn();
      
      // Crear middleware que modifica el evento
      const middleware = jest.fn(event => ({
        ...event,
        enriched: true
      }));
      
      // Registrar middleware y suscriptor
      eventPublisher.use(middleware);
      eventPublisher.subscribe(eventType, callback);
      
      // Publicar evento
      await eventPublisher.publish(eventType, payload);
      
      // Verificaciones
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Verificar que el evento fue modificado por el middleware
      const expectedEvent = {
        type: eventType,
        payload,
        timestamp: expect.any(String),
        enriched: true
      };
      
      expect(callback).toHaveBeenCalledWith(expectedEvent);
    });

    it('debería cancelar la entrega si un middleware devuelve null', async () => {
      // Datos de prueba
      const eventType = 'test.event';
      const callback = jest.fn();
      
      // Crear middleware que cancela el evento
      const cancellingMiddleware = jest.fn(() => null);
      
      // Registrar middleware y suscriptor
      eventPublisher.use(cancellingMiddleware);
      eventPublisher.subscribe(eventType, callback);
      
      // Publicar evento
      await eventPublisher.publish(eventType, { data: 'test' });
      
      // Verificaciones
      expect(cancellingMiddleware).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });

    it('debería continuar si un suscriptor lanza un error', async () => {
      // Datos de prueba
      const eventType = 'test.event';
      
      // Crear callbacks
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const successCallback = jest.fn();
      
      // Registrar suscriptores
      eventPublisher.subscribe(eventType, errorCallback);
      eventPublisher.subscribe(eventType, successCallback);
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Publicar evento
      await eventPublisher.publish(eventType);
      
      // Restaurar console.error
      console.error = originalConsoleError;
      
      // Verificaciones
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(successCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('debería eliminar todos los suscriptores', () => {
      // Datos de prueba
      const callback = jest.fn();
      
      // Suscribir a varios eventos
      eventPublisher.subscribe('event1', callback);
      eventPublisher.subscribe('event2', callback);
      eventPublisher.subscribe('event3', callback);
      
      // Verificar que hay suscriptores
      expect(eventPublisher.subscribers.size).toBe(3);
      
      // Limpiar
      eventPublisher.clear();
      
      // Verificar que se eliminaron todos
      expect(eventPublisher.subscribers.size).toBe(0);
    });
  });
});
