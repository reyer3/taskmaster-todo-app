/**
 * Pruebas unitarias para el modelo de NotificationPreference
 */
const { NotificationPreference } = require('../../../../src/domain/notifications/notification-preference.model');

describe('NotificationPreference Model', () => {
  describe('Constructor', () => {
    it('debería crear una preferencia de notificación válida con todos los campos', () => {
      // Arrange
      const prefData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111',
        emailEnabled: true,
        pushEnabled: true,
        emailTaskCreated: true,
        emailTaskDueSoon: true,
        emailTaskCompleted: false,
        pushTaskCreated: true,
        pushTaskUpdated: true,
        pushTaskCompleted: true,
        pushTaskDeleted: false,
        pushTaskDueSoon: true,
        dailyDigest: false,
        weeklyDigest: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02')
      };

      // Act
      const preference = new NotificationPreference(prefData);

      // Assert
      expect(preference.id).toBe(prefData.id);
      expect(preference.userId).toBe(prefData.userId);
      expect(preference.emailEnabled).toBe(prefData.emailEnabled);
      expect(preference.pushEnabled).toBe(prefData.pushEnabled);
      expect(preference.emailTaskCreated).toBe(prefData.emailTaskCreated);
      expect(preference.emailTaskDueSoon).toBe(prefData.emailTaskDueSoon);
      expect(preference.emailTaskCompleted).toBe(prefData.emailTaskCompleted);
      expect(preference.pushTaskCreated).toBe(prefData.pushTaskCreated);
      expect(preference.pushTaskUpdated).toBe(prefData.pushTaskUpdated);
      expect(preference.pushTaskCompleted).toBe(prefData.pushTaskCompleted);
      expect(preference.pushTaskDeleted).toBe(prefData.pushTaskDeleted);
      expect(preference.pushTaskDueSoon).toBe(prefData.pushTaskDueSoon);
      expect(preference.dailyDigest).toBe(prefData.dailyDigest);
      expect(preference.weeklyDigest).toBe(prefData.weeklyDigest);
      expect(preference.createdAt).toEqual(prefData.createdAt);
      expect(preference.updatedAt).toEqual(prefData.updatedAt);
    });

    it('debería crear una preferencia con valores por defecto cuando no se proporcionan', () => {
      // Arrange
      const minimalData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111'
      };

      // Act
      const preference = new NotificationPreference(minimalData);

      // Assert
      expect(preference.id).toBe(minimalData.id);
      expect(preference.userId).toBe(minimalData.userId);
      expect(preference.emailEnabled).toBe(true); // Default
      expect(preference.pushEnabled).toBe(true); // Default
      expect(preference.emailTaskCreated).toBe(true); // Default
      expect(preference.emailTaskDueSoon).toBe(true); // Default
      expect(preference.emailTaskCompleted).toBe(false); // Default
      expect(preference.pushTaskCreated).toBe(true); // Default
      expect(preference.pushTaskUpdated).toBe(true); // Default
      expect(preference.pushTaskCompleted).toBe(true); // Default
      expect(preference.pushTaskDeleted).toBe(false); // Default
      expect(preference.pushTaskDueSoon).toBe(true); // Default
      expect(preference.dailyDigest).toBe(false); // Default
      expect(preference.weeklyDigest).toBe(true); // Default
      expect(preference.createdAt).toBeInstanceOf(Date);
      expect(preference.updatedAt).toBeInstanceOf(Date);
    });

    it('debería lanzar error cuando faltan campos obligatorios', () => {
      // Arrange
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000'
        // userId falta
      };

      // Act & Assert
      expect(() => new NotificationPreference(invalidData)).toThrow('userId es requerido');
    });
  });

  describe('Métodos', () => {
    it('debería actualizar las preferencias de email correctamente', () => {
      // Arrange
      const preference = new NotificationPreference({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111'
      });

      // Act
      preference.updateEmailPreferences({
        emailEnabled: false,
        emailTaskCreated: false
      });

      // Assert
      expect(preference.emailEnabled).toBe(false);
      expect(preference.emailTaskCreated).toBe(false);
      expect(preference.updatedAt).toBeInstanceOf(Date);
    });

    it('debería actualizar las preferencias de push correctamente', () => {
      // Arrange
      const preference = new NotificationPreference({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111'
      });

      // Act
      preference.updatePushPreferences({
        pushEnabled: false,
        pushTaskCreated: false
      });

      // Assert
      expect(preference.pushEnabled).toBe(false);
      expect(preference.pushTaskCreated).toBe(false);
      expect(preference.updatedAt).toBeInstanceOf(Date);
    });

    it('debería actualizar las preferencias de digestos correctamente', () => {
      // Arrange
      const preference = new NotificationPreference({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111'
      });

      // Act
      preference.updateDigestPreferences({
        dailyDigest: true,
        weeklyDigest: false
      });

      // Assert
      expect(preference.dailyDigest).toBe(true);
      expect(preference.weeklyDigest).toBe(false);
      expect(preference.updatedAt).toBeInstanceOf(Date);
    });

    it('debería habilitar o deshabilitar todas las notificaciones', () => {
      // Arrange
      const preference = new NotificationPreference({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111'
      });

      // Act - deshabilitar todo
      preference.setAllNotifications(false);

      // Assert
      expect(preference.emailEnabled).toBe(false);
      expect(preference.pushEnabled).toBe(false);

      // Act - habilitar todo
      preference.setAllNotifications(true);

      // Assert
      expect(preference.emailEnabled).toBe(true);
      expect(preference.pushEnabled).toBe(true);
    });

    it('debería verificar si un tipo de evento específico está habilitado', () => {
      // Arrange
      const preference = new NotificationPreference({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111',
        emailTaskCreated: true,
        pushTaskCreated: false
      });

      // Act & Assert
      expect(preference.isEventTypeEnabled('task.created', 'email')).toBe(true);
      expect(preference.isEventTypeEnabled('task.created', 'push')).toBe(false);
      
      // Eventos no especificados o canales no válidos deberían devolver false
      expect(preference.isEventTypeEnabled('task.unknown', 'email')).toBe(false);
      expect(preference.isEventTypeEnabled('task.created', 'unknown')).toBe(false);
    });

    it('debería aplicar actualizaciones masivas a través de update()', () => {
      // Arrange
      const preference = new NotificationPreference({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '789e4567-e89b-12d3-a456-426614174111'
      });

      // Act
      preference.update({
        emailEnabled: false,
        pushTaskCreated: false,
        dailyDigest: true,
        // Campo inválido que debería ser ignorado
        invalidField: 'value'
      });

      // Assert
      expect(preference.emailEnabled).toBe(false);
      expect(preference.pushTaskCreated).toBe(false);
      expect(preference.dailyDigest).toBe(true);
      // @ts-ignore - Verificar que el campo inválido no fue añadido
      expect(preference.invalidField).toBeUndefined();
    });
  });
});