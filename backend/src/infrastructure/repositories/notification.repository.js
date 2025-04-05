/**
 * Repositorio para la gestión de notificaciones persistentes
 */
const { prisma } = require('../database/prisma-client');
const { Notification } = require('../../domain/notifications/notification.model');

class NotificationRepository {
  /**
   * Obtiene todas las notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Notification[]>} Lista de notificaciones
   */
  async findByUserId(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      onlyUnread = false,
      types = [],
      sortDirection = 'desc'
    } = options;

    const whereClause = {
      userId,
      ...(onlyUnread ? { isRead: false } : {}),
      ...(types.length > 0 ? { type: { in: types } } : {})
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: sortDirection
      },
      skip: offset,
      take: limit
    });

    return notifications.map(notification => new Notification(notification));
  }

  /**
   * Obtiene una notificación por su ID
   * @param {string} id - ID de la notificación
   * @returns {Promise<Notification|null>} Notificación o null si no existe
   */
  async findById(id) {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) return null;

    return new Notification(notification);
  }

  /**
   * Crea una nueva notificación
   * @param {Notification} notification - Objeto de notificación
   * @returns {Promise<Notification>} Notificación creada
   */
  async create(notification) {
    const created = await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        data: notification.data,
        relatedId: notification.relatedId,
        expiresAt: notification.expiresAt
      }
    });

    return new Notification(created);
  }

  /**
   * Actualiza una notificación existente
   * @param {Notification} notification - Notificación con datos actualizados
   * @returns {Promise<Notification>} Notificación actualizada
   */
  async update(notification) {
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: notification.isRead,
        expiresAt: notification.expiresAt
      }
    });

    return new Notification(updated);
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   * @param {string} userId - ID del usuario
   * @param {Array<string>} [ids] - IDs de notificaciones específicas (opcional)
   * @returns {Promise<number>} Número de notificaciones actualizadas
   */
  async markAsRead(userId, ids = []) {
    const whereClause = {
      userId,
      isRead: false,
      ...(ids.length > 0 ? { id: { in: ids } } : {})
    };

    const result = await prisma.notification.updateMany({
      where: whereClause,
      data: {
        isRead: true
      }
    });

    return result.count;
  }

  /**
   * Elimina notificaciones antiguas o expiradas
   * @param {Object} options - Opciones de eliminación
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  async deleteExpired(olderThan = 7, onlyRead = true) {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - olderThan));

    const whereClause = {
      OR: [
        { expiresAt: { lt: cutoffDate } },
        { 
          createdAt: { lt: cutoffDate },
          ...(onlyRead ? { isRead: true } : {})
        }
      ]
    };

    const result = await prisma.notification.deleteMany({
      where: whereClause
    });

    return result.count;
  }

  /**
   * Elimina una notificación específica
   * @param {string} id - ID de la notificación
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(id) {
    await prisma.notification.delete({
      where: { id }
    });

    return true;
  }

  /**
   * Elimina todas las notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de eliminación
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  async deleteAllForUser(userId, options = {}) {
    const { onlyRead = true } = options;

    const whereClause = {
      userId,
      ...(onlyRead ? { isRead: true } : {})
    };

    const result = await prisma.notification.deleteMany({
      where: whereClause
    });

    return result.count;
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} Número de notificaciones no leídas
   */
  async countUnread(userId) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
  }
}

module.exports = { NotificationRepository };
