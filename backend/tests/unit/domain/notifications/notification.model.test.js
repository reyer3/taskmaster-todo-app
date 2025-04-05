  /**
   * Pruebas unitarias para el modelo de dominio Notification
   */
  const { Notification } = require('../../../../src/domain/notifications/notification.model');

  describe('Notification Model', () => {
    describe('Constructor', () => {
      it('debería crear una instancia de Notification con valores proporcionados', () => {
        // Datos completos
        const now = new Date();
        const expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 día después

        const notificationData = {
          id: 'notif123',
          userId: 'user123',
          type: 'task.created',
          title: 'Nueva tarea',
          message: 'Has creado una nueva tarea',
          isRead: false,
          data: { taskId: 'task123', title: 'Tarea 1' },
          relatedId: 'task123',
          createdAt: now,
          expiresAt: expiration
        };

        // Crear instancia
        const notification = new Notification(notificationData);

        // Verificaciones
        expect(notification).toBeInstanceOf(Notification);
        expect(notification.id).toBe('notif123');
        expect(notification.userId).toBe('user123');
        expect(notification.type).toBe('task.created');
        expect(notification.title).toBe('Nueva tarea');
        expect(notification.message).toBe('Has creado una nueva tarea');
        expect(notification.isRead).toBe(false);
        expect(notification.data).toEqual({ taskId: 'task123', title: 'Tarea 1' });
        expect(notification.relatedId).toBe('task123');
        expect(notification.createdAt).toEqual(now);
        expect(notification.expiresAt).toEqual(expiration);
      });

      it('debería crear una instancia con valores por defecto para campos opcionales', () => {
        // Datos mínimos
        const notificationData = {
          id: 'notif123',
          userId: 'user123',
          type: 'task.created',
          title: 'Nueva tarea',
          message: 'Has creado una nueva tarea'
        };

        // Crear instancia
        const notification = new Notification(notificationData);

        // Verificaciones
        expect(notification).toBeInstanceOf(Notification);
        expect(notification.id).toBe('notif123');
        expect(notification.userId).toBe('user123');
        expect(notification.type).toBe('task.created');
        expect(notification.title).toBe('Nueva tarea');
        expect(notification.message).toBe('Has creado una nueva tarea');
        expect(notification.isRead).toBe(false); // valor por defecto
        expect(notification.data).toBeNull(); // valor por defecto
        expect(notification.relatedId).toBeNull(); // valor por defecto
        expect(notification.createdAt).toBeInstanceOf(Date); // fecha actual por defecto
        expect(notification.expiresAt).toBeNull(); // valor por defecto
      });
    });

    describe('Métodos de instancia', () => {
      let notification;

      beforeEach(() => {
        // Crear una instancia fresca para cada prueba
        notification = new Notification({
          id: 'notif123',
          userId: 'user123',
          type: 'task.created',
          title: 'Nueva tarea',
          message: 'Has creado una nueva tarea',
          isRead: false
        });
      });

      describe('markAsRead', () => {
        it('debería marcar la notificación como leída', () => {
          const result = notification.markAsRead();

          expect(notification.isRead).toBe(true);
          expect(result).toBe(notification); // Debe retornar this para encadenamiento
        });
      });

      describe('markAsUnread', () => {
        it('debería marcar la notificación como no leída', () => {
          // Primero marcar como leída
          notification.markAsRead();
          expect(notification.isRead).toBe(true);

          // Ahora marcar como no leída
          const result = notification.markAsUnread();

          expect(notification.isRead).toBe(false);
          expect(result).toBe(notification); // Debe retornar this para encadenamiento
        });
      });

      describe('setExpirationDate', () => {
        it('debería establecer la fecha de expiración', () => {
          const expirationDate = new Date('2025-12-31');
          const result = notification.setExpirationDate(expirationDate);

          expect(notification.expiresAt).toEqual(expirationDate);
          expect(result).toBe(notification); // Debe retornar this para encadenamiento
        });
      });

      describe('hasExpired', () => {
        it('debería retornar false si no hay fecha de expiración', () => {
          expect(notification.expiresAt).toBeNull();
          expect(notification.hasExpired()).toBe(false);
        });

        it('debería retornar true si la fecha de expiración es pasada', () => {
          // Establecer fecha de expiración en el pasado
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - 1); // Ayer
          notification.setExpirationDate(pastDate);

          expect(notification.hasExpired()).toBe(true);
        });

        it('debería retornar false si la fecha de expiración es futura', () => {
          // Establecer fecha de expiración en el futuro
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 1); // Mañana
          notification.setExpirationDate(futureDate);

          expect(notification.hasExpired()).toBe(false);
        });
      });

      describe('toDTO', () => {
        it('debería convertir la notificación a un objeto DTO', () => {
          // Preparar una notificación con todos los campos
          const now = new Date();
          const expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const fullNotification = new Notification({
            id: 'notif123',
            userId: 'user123',
            type: 'task.created',
            title: 'Nueva tarea',
            message: 'Has creado una nueva tarea',
            isRead: true,
            data: { taskId: 'task123' },
            relatedId: 'task123',
            createdAt: now,
            expiresAt: expiration
          });

          const dto = fullNotification.toDTO();

          // Verificar que tenga todos los campos esperados
          expect(dto).toEqual({
            id: 'notif123',
            type: 'task.created',
            title: 'Nueva tarea',
            message: 'Has creado una nueva tarea',
            isRead: true,
            data: { taskId: 'task123' },
            relatedId: 'task123',
            createdAt: now,
            expiresAt: expiration
          });

          // Verificar que no incluya el userId (no se envía al cliente)
          expect(dto.userId).toBeUndefined();
        });
      });
    });

    describe('Métodos estáticos', () => {
      describe('fromEvent', () => {
        it('debería crear una notificación a partir de un evento de tarea creada', () => {
          const userId = 'user123';
          const eventType = 'task.created';
          const eventPayload = {
            taskId: 'task123',
            title: 'Mi nueva tarea'
          };

          const notification = Notification.fromEvent(userId, eventType, eventPayload);

          expect(notification).toBeInstanceOf(Notification);
          expect(notification.userId).toBe(userId);
          expect(notification.type).toBe(eventType);
          expect(notification.title).toBe('Nueva tarea');
          expect(notification.message).toBe('Se ha creado la tarea: Mi nueva tarea');
          expect(notification.isRead).toBe(false);
          expect(notification.data).toEqual(eventPayload);
          expect(notification.relatedId).toBe('task123');
          expect(notification.createdAt).toBeInstanceOf(Date);
          expect(notification.expiresAt).toBeNull();
        });

        it('debería crear una notificación con fecha de expiración si se proporciona', () => {
          const userId = 'user123';
          const eventType = 'task.created';
          const eventPayload = { taskId: 'task123', title: 'Mi tarea' };
          const options = { expiresIn: 3600000 }; // 1 hora en milisegundos

          const notification = Notification.fromEvent(userId, eventType, eventPayload, options);

          expect(notification.expiresAt).toBeInstanceOf(Date);

          // La fecha de expiración debería estar aproximadamente 1 hora en el futuro
          const expectedExpiration = new Date(Date.now() + 3600000);
          const timeDifference = Math.abs(notification.expiresAt.getTime() - expectedExpiration.getTime());

          // Permitir una diferencia de hasta 100 ms debido al tiempo de ejecución
          expect(timeDifference).toBeLessThan(100);
        });

        it('debería crear una notificación con id personalizado si se proporciona', () => {
          const userId = 'user123';
          const eventType = 'task.created';
          const eventPayload = { taskId: 'task123', title: 'Mi tarea' };
          const options = { id: 'customId123' };

          const notification = Notification.fromEvent(userId, eventType, eventPayload, options);

          expect(notification.id).toBe('customId123');
        });
      });

      describe('extractRelatedId', () => {
        it('debería extraer taskId para eventos de tareas', () => {
          const eventType = 'task.updated';
          const payload = { taskId: 'task123', title: 'Tarea actualizada' };

          const relatedId = Notification.extractRelatedId(eventType, payload);

          expect(relatedId).toBe('task123');
        });

        it('debería extraer userId para eventos de usuario', () => {
          const eventType = 'user.login_success';
          const payload = { userId: 'user123', timestamp: new Date() };

          const relatedId = Notification.extractRelatedId(eventType, payload);

          expect(relatedId).toBe('user123');
        });

        it('debería retornar null para otros tipos de eventos', () => {
          const eventType = 'system.error';
          const payload = { message: 'Error del sistema', code: 500 };

          const relatedId = Notification.extractRelatedId(eventType, payload);

          expect(relatedId).toBeNull();
        });
      });

      describe('formatEventMessage', () => {
        it('debería formatear mensaje para task.created', () => {
          const eventType = 'task.created';
          const payload = { title: 'Mi nueva tarea' };

          const { title, message } = Notification.formatEventMessage(eventType, payload);

          expect(title).toBe('Nueva tarea');
          expect(message).toBe('Se ha creado la tarea: Mi nueva tarea');
        });

        it('debería formatear mensaje para task.completed', () => {
          const eventType = 'task.completed';
          const payload = { title: 'Mi tarea' };

          const { title, message } = Notification.formatEventMessage(eventType, payload);

          expect(title).toBe('¡Tarea completada!');
          expect(message).toBe('Has completado la tarea: Mi tarea');
        });

        it('debería formatear mensaje para task.due_soon', () => {
          const eventType = 'task.due_soon';
          const payload = { taskCount: 3 };

          const { title, message } = Notification.formatEventMessage(eventType, payload);

          expect(title).toBe('Tareas pendientes');
          expect(message).toBe('Tienes 3 tareas pendientes para los próximos días');
        });

        it('debería formatear mensaje para user.registered', () => {
          const eventType = 'user.registered';
          const payload = { name: 'Juan' };

          const { title, message } = Notification.formatEventMessage(eventType, payload);

          expect(title).toBe('¡Bienvenido!');
          expect(message).toBe('Tu cuenta ha sido creada exitosamente');
        });

        it('debería usar valores por defecto para eventos desconocidos', () => {
          const eventType = 'custom.event';
          const payload = {};

          const { title, message } = Notification.formatEventMessage(eventType, payload);

          expect(title).toBe('Notificación');
          expect(message).toBe('Notificación del sistema: custom.event');
        });

        it('debería usar title y message del payload si están disponibles', () => {
          const eventType = 'custom.event';
          const payload = {
            title: 'Título personalizado',
            message: 'Mensaje personalizado'
          };

          const { title, message } = Notification.formatEventMessage(eventType, payload);

          expect(title).toBe('Título personalizado');
          expect(message).toBe('Mensaje personalizado');
        });
      });
    });
  });
