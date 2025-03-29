/**
 * Repositorio para la gestión de preferencias de notificaciones
 */
const { prisma } = require('../database/prisma-client');
const { NotificationPreference } = require('../../domain/notifications/notification-preference.model');

class NotificationPreferenceRepository {
  /**
   * Obtiene las preferencias de notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<NotificationPreference|null>} Preferencias o null si no existen
   */
  async findByUserId(userId) {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!preferences) return null;

    return new NotificationPreference(preferences);
  }

  /**
   * Guarda o actualiza las preferencias de notificaciones de un usuario
   * @param {NotificationPreference} preferences - Objeto de preferencias
   * @returns {Promise<NotificationPreference>} Preferencias guardadas
   */
  async saveOrUpdate(preferences) {
    // Verificar si existen preferencias para el usuario
    const existing = await this.findByUserId(preferences.userId);

    if (existing) {
      // Actualizar preferencias existentes
      const updated = await prisma.notificationPreference.update({
        where: { userId: preferences.userId },
        data: {
          emailEnabled: preferences.emailEnabled,
          emailTaskCreated: preferences.emailTaskCreated,
          emailTaskDueSoon: preferences.emailTaskDueSoon,
          emailTaskCompleted: preferences.emailTaskCompleted,
          pushEnabled: preferences.pushEnabled,
          pushTaskCreated: preferences.pushTaskCreated,
          pushTaskUpdated: preferences.pushTaskUpdated,
          pushTaskCompleted: preferences.pushTaskCompleted,
          pushTaskDeleted: preferences.pushTaskDeleted,
          pushTaskDueSoon: preferences.pushTaskDueSoon,
          dailyDigest: preferences.dailyDigest,
          weeklyDigest: preferences.weeklyDigest,
          updatedAt: new Date()
        }
      });

      return new NotificationPreference(updated);
    } else {
      // Crear nuevas preferencias
      const created = await prisma.notificationPreference.create({
        data: {
          userId: preferences.userId,
          emailEnabled: preferences.emailEnabled,
          emailTaskCreated: preferences.emailTaskCreated,
          emailTaskDueSoon: preferences.emailTaskDueSoon,
          emailTaskCompleted: preferences.emailTaskCompleted,
          pushEnabled: preferences.pushEnabled,
          pushTaskCreated: preferences.pushTaskCreated,
          pushTaskUpdated: preferences.pushTaskUpdated,
          pushTaskCompleted: preferences.pushTaskCompleted,
          pushTaskDeleted: preferences.pushTaskDeleted,
          pushTaskDueSoon: preferences.pushTaskDueSoon,
          dailyDigest: preferences.dailyDigest,
          weeklyDigest: preferences.weeklyDigest
        }
      });

      return new NotificationPreference(created);
    }
  }

  /**
   * Crea preferencias por defecto para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<NotificationPreference>} Preferencias creadas
   */
  async createDefaults(userId) {
    // Verificar si ya existen preferencias
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    // Crear preferencias por defecto
    const defaults = NotificationPreference.createDefaults(userId);
    return this.saveOrUpdate(defaults);
  }

  /**
   * Actualiza una configuración específica de las preferencias
   * @param {string} userId - ID del usuario
   * @param {string} key - Clave de la preferencia
   * @param {boolean} value - Nuevo valor
   * @returns {Promise<NotificationPreference>} Preferencias actualizadas
   */
  async updateSetting(userId, key, value) {
    // Primero obtener las preferencias actuales o crear por defecto
    let preferences = await this.findByUserId(userId);
    
    if (!preferences) {
      preferences = NotificationPreference.createDefaults(userId);
    }

    // Verificar que la clave existe en el modelo
    if (!preferences.hasOwnProperty(key)) {
      throw new Error(`La configuración ${key} no existe en las preferencias de notificaciones`);
    }

    // Actualizar el valor
    preferences[key] = value;
    preferences.updatedAt = new Date();

    // Guardar los cambios
    return this.saveOrUpdate(preferences);
  }

  /**
   * Elimina las preferencias de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(userId) {
    try {
      await prisma.notificationPreference.delete({
        where: { userId }
      });
      return true;
    } catch (error) {
      // Si no existe el registro, consideramos que la operación fue exitosa
      if (error.code === 'P2025') {
        return true;
      }
      throw error;
    }
  }

  /**
   * Obtiene una lista de usuarios con notificaciones diarias habilitadas
   * @returns {Promise<string[]>} Lista de IDs de usuarios
   */
  async getUsersWithDailyDigest() {
    const results = await prisma.notificationPreference.findMany({
      where: {
        dailyDigest: true,
        emailEnabled: true
      },
      select: {
        userId: true
      }
    });

    return results.map(result => result.userId);
  }

  /**
   * Obtiene una lista de usuarios con notificaciones semanales habilitadas
   * @returns {Promise<string[]>} Lista de IDs de usuarios
   */
  async getUsersWithWeeklyDigest() {
    const results = await prisma.notificationPreference.findMany({
      where: {
        weeklyDigest: true,
        emailEnabled: true
      },
      select: {
        userId: true
      }
    });

    return results.map(result => result.userId);
  }
}

module.exports = { NotificationPreferenceRepository };
