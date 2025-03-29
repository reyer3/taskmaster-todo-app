# Sistema de Publicación de Eventos

## Descripción

Esta feature implementa un sistema de publicación/suscripción de eventos (pub/sub) para permitir una comunicación desacoplada entre los diferentes componentes de la aplicación. El sistema permite publicar eventos desde cualquier parte del código y reaccionar a ellos a través de suscriptores especializados.

## Componentes Principales

1. **EventPublisher**: Clase principal que implementa el patrón pub/sub, permitiendo:
   - Publicación de eventos tipados
   - Suscripción a eventos específicos
   - Middlewares para procesamiento de eventos
   - Manejo asíncrono de suscriptores

2. **EventTypes**: Definición centralizada de tipos de eventos para evitar errores por uso de cadenas de texto.

3. **EventLogger**: Sistema de registro automático de eventos para debugging.

4. **Suscriptores**: Módulos especializados que reaccionan a eventos específicos (ej: NotificationSubscriber).

## Beneficios

1. **Bajo acoplamiento**: Los servicios no necesitan conocerse entre sí, solo interactúan a través de eventos.
2. **Extensibilidad**: Nuevas funcionalidades pueden añadirse como suscriptores sin modificar el código existente.
3. **Auditabilidad**: Todos los eventos importantes son registrados automáticamente.
4. **Paralelismo**: Los suscriptores procesan eventos de forma asíncrona sin bloquear el flujo principal.

## Eventos Implementados

### Eventos de Usuario
- `user.registered`: Usuario registrado en el sistema
- `user.updated`: Datos de usuario actualizados
- `user.password_changed`: Cambio de contraseña
- `user.login_success`: Inicio de sesión exitoso
- `user.login_failed`: Intento fallido de inicio de sesión

### Eventos de Tareas
- `task.created`: Nueva tarea creada
- `task.updated`: Tarea actualizada
- `task.completed`: Tarea marcada como completada
- `task.deleted`: Tarea eliminada
- `task.due_soon`: Tareas próximas a vencer

### Eventos de Sistema
- `system.startup`: Inicio de la aplicación
- `system.shutdown`: Cierre de la aplicación
- `system.error`: Error en el sistema
- `system.health_check`: Verificación de salud

## Integración con Servicios

El sistema de eventos ha sido integrado con:

1. **AuthService**: Publica eventos relacionados con la autenticación y gestión de usuarios.
2. **TaskService**: Publica eventos relacionados con operaciones de tareas.
3. **Middleware de errores**: Publica eventos de error que ocurren en la API.

## Uso Básico

```javascript
// Publicar un evento
eventPublisher.publish(UserEvents.REGISTERED, { userId: '123', email: 'user@example.com' });

// Suscribirse a un evento
const unsubscribe = eventPublisher.subscribe(TaskEvents.COMPLETED, (event) => {
  console.log(`Tarea ${event.payload.title} completada`);
});

// Cancelar suscripción
unsubscribe();
```

## Próximos Pasos

- Implementar sistema de colas para eventos persistentes
- Añadir métricas de rendimiento y monitoreo
- Implementar notificaciones en tiempo real a través de WebSockets
