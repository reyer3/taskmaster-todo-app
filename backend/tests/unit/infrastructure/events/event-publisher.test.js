/**
 * Test unitario para EventPublisher
 */
const { EventPublisher } = require('../../../../src/infrastructure/events/event-publisher');

describe('EventPublisher', () => {
  let publisher;
  
  beforeEach(() => {
    publisher = new EventPublisher();
  });
  
  afterEach(() => {
    publisher.clear();
  });
  
  test('debe permitir suscribirse a eventos', () => {
    const callback = jest.fn();
    const unsubscribe = publisher.subscribe('test.event', callback);
    
    expect(typeof unsubscribe).toBe('function');
    expect(publisher.subscribers.has('test.event')).toBe(true);
  });
  
  test('debe permitir cancelar suscripciones', () => {
    const callback = jest.fn();
    const unsubscribe = publisher.subscribe('test.event', callback);
    
    expect(publisher.subscribers.has('test.event')).toBe(true);
    
    unsubscribe();
    
    expect(publisher.subscribers.has('test.event')).toBe(false);
  });
  
  test('debe notificar a los suscriptores cuando se publica un evento', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const eventData = { id: '123' };
    
    publisher.subscribe('test.event', callback1);
    publisher.subscribe('test.event', callback2);
    
    await publisher.publish('test.event', eventData);
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    
    // Verificar que el payload llegó correctamente
    const eventArg = callback1.mock.calls[0][0];
    expect(eventArg).toHaveProperty('type', 'test.event');
    expect(eventArg).toHaveProperty('payload', eventData);
    expect(eventArg).toHaveProperty('timestamp');
  });
  
  test('debe aplicar middlewares a los eventos', async () => {
    const callback = jest.fn();
    const middleware = jest.fn(event => {
      event.middlewareApplied = true;
      return event;
    });
    
    publisher.use(middleware);
    publisher.subscribe('test.event', callback);
    
    await publisher.publish('test.event', { id: '123' });
    
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    
    const eventArg = callback.mock.calls[0][0];
    expect(eventArg).toHaveProperty('middlewareApplied', true);
  });
  
  test('debe permitir cancelar eventos desde middleware', async () => {
    const callback = jest.fn();
    const middleware = jest.fn(() => null); // Devolver null cancela el evento
    
    publisher.use(middleware);
    publisher.subscribe('test.event', callback);
    
    await publisher.publish('test.event', { id: '123' });
    
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });
  
  test('debe manejar errores en los suscriptores sin interrumpir el flujo', async () => {
    const callbackWithError = jest.fn(() => {
      throw new Error('Error en el suscriptor');
    });
    const normalCallback = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    publisher.subscribe('test.event', callbackWithError);
    publisher.subscribe('test.event', normalCallback);
    
    await publisher.publish('test.event', { id: '123' });
    
    expect(callbackWithError).toHaveBeenCalledTimes(1);
    expect(normalCallback).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
  
  test('debe ignorar publicaciones para tipos sin suscriptores', async () => {
    const callback = jest.fn();
    
    publisher.subscribe('test.event', callback);
    
    await publisher.publish('other.event', { id: '123' });
    
    expect(callback).not.toHaveBeenCalled();
  });
  
  test('debe limpiar todas las suscripciones con clear()', () => {
    publisher.subscribe('event1', jest.fn());
    publisher.subscribe('event2', jest.fn());
    
    expect(publisher.subscribers.size).toBe(2);
    
    publisher.clear();
    
    expect(publisher.subscribers.size).toBe(0);
  });
});
