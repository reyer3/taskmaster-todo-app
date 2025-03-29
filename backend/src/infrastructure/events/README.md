# Sistema de Publicación de Eventos

Este módulo implementa un sistema de eventos basado en el patrón publisher/subscriber que permite la comunicación desacoplada entre componentes de la aplicación.

## Características

- Publicación y suscripción a eventos tipados
- Middlewares para procesar eventos antes de su entrega
- Sistema de registro de eventos para depuración y auditoría
- Manejo asíncrono de eventos
- Tipos de eventos predefinidos para evitar errores

## Estructura

- `event-publisher.js`: Implementación del patrón publisher/subscriber
- `event-types.js`: Definición centralizada de tipos de eventos
- `event-logger.js`: Sistema de registro de eventos
- `index.js`: Punto de entrada y función de inicialización

## Uso básico

```javascript
// Importar el sistema de eventos
const { eventPublisher, eventTypes } = require('../infrastructure/events');
const { UserEvents } = eventTypes;

// Publicar un evento
eventPublisher.publish(UserEvents.REGISTERED, { 
  userId: '123', 
  email: 'usuario@ejemplo.com' 
});

// Suscribirse a un evento
const unsubscribe = eventPublisher.subscribe(UserEvents.REGISTERED, (event) => {
  console.log(`Nuevo usuario registrado: ${event.payload.email}`);
  // Realizar acciones en respuesta al evento
});

// Cancelar suscripción cuando ya no sea necesaria
unsubscribe();
```

## Integración con servicios

Para integrar el sistema de eventos en los servicios existentes, se recomienda publicar eventos después de operaciones importantes:

```javascript
// En auth.service.js
async register(userData) {
  // Lógica existente...
  const user = await this.userRepository.create(newUser);
  
  // Publicar evento después de crear el usuario
  await eventPublisher.publish(UserEvents.REGISTERED, {
    userId: user.id,
    email: user.email,
    timestamp: new Date().toISOString()
  });
  
  return user;
}
```

## Buenas prácticas

1. **Usar tipos predefinidos**: Siempre usar los tipos de eventos del archivo `event-types.js`
2. **Eventos inmutables**: Tratar los eventos como inmutables dentro de los suscriptores
3. **Manejo de errores**: Capturar errores en los suscriptores para evitar interrumpir el flujo
4. **Payload mínimo**: Incluir sólo la información necesaria en el payload
5. **Desacoplamiento**: Los suscriptores no deberían depender de efectos secundarios de otros suscriptores
