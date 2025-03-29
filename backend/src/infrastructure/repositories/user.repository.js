/**
 * Implementación de repositorio para Usuarios
 */
const { prisma } = require('../database/prisma-client');
const { User, ValidationError } = require('../../domain/auth/user.model');

class UserRepository {
  constructor(eventPublisher = null) {
    this._prisma = prisma;
    this._eventPublisher = eventPublisher;
  }

  /**
   * Encuentra un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>} Objeto User o null si no existe
   */
  async findById(id) {
    console.log(`findById llamado con id: ${id}`);
    console.trace(); // Muestra la pila de llamadas completa
    // Validar que id no sea undefined o null
    if (!id) {
      throw new ValidationError('ID de usuario no puede estar vacío');
    }

    const userData = await this._prisma.user.findUnique({
      where: { id }
    });

    if (!userData) return null;

    return User.reconstitute(userData);
  }

  /**
   * Encuentra un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<User|null>} Objeto User o null si no existe
   */
  async findByEmail(email) {
    if (!email) {
      throw new ValidationError('Email no puede estar vacío');
    }

    const userData = await this._prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!userData) return null;

    return User.reconstitute(userData);
  }

  /**
   * Crea un nuevo usuario
   * @param {User} user - Objeto User a crear
   * @returns {Promise<User>} Usuario creado
   */
  async create(user) {
    const created = await this._prisma.user.create({
      data: user.toPersistence()
    });

    // Publicar eventos
    this._publishEvents(user);

    return User.reconstitute(created);
  }

  /**
   * Actualiza un usuario existente
   * @param {User} user - Objeto User con datos actualizados
   * @returns {Promise<User>} Usuario actualizado
   */
  async update(user) {
    const updated = await this._prisma.user.update({
      where: { id: user.id },
      data: user.toPersistence()
    });

    // Publicar eventos
    this._publishEvents(user);

    return User.reconstitute(updated);
  }

  /**
   * Verifica si existe un usuario con el email dado
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} true si existe, false si no
   */
  async existsByEmail(email) {
    if (!email) {
      throw new ValidationError('Email no puede estar vacío');
    }

    const count = await this._prisma.user.count({
      where: { email: email.toLowerCase() }
    });

    return count > 0;
  }

  /**
   * Elimina un usuario por su ID (soft delete)
   * @param {string} id - ID del usuario a eliminar
   * @returns {Promise<boolean>} true si se eliminó, false si no existía
   */
  async softDelete(id) {
    try {
      const user = await this.findById(id);
      if (!user) return false;

      user.deactivate();
      await this.update(user);
      return true;
    } catch (error) {
      console.error('Error en softDelete:', error);
      return false;
    }
  }

  /**
   * Ejecuta operaciones en una transacción
   * @param {Function} callback - Función que recibe un repositorio transaccional
   * @returns {Promise<T>} Resultado de la transacción
   */
  async withTransaction(callback) {
    return this._prisma.$transaction(async (tx) => {
      // Crear un nuevo repositorio que use la transacción
      const txRepo = new UserRepository(this._eventPublisher);
      txRepo._prisma = tx;

      // Ejecutar el callback con el repositorio transaccional
      return await callback(txRepo);
    });
  }

  /**
   * Publica los eventos pendientes del usuario
   * @param {User} user - Usuario cuyos eventos se publicarán
   * @private
   */
  _publishEvents(user) {
    if (this._eventPublisher && user.events.length > 0) {
      for (const event of user.events) {
        this._eventPublisher.publish(event);
      }
      user.clearEvents();
    }
  }

  /**
   * Busca usuarios según criterios
   * @param {Object} criteria - Criterios de búsqueda
   * @param {Object} options - Opciones de paginación y orden
   * @returns {Promise<{users: User[], total: number}>} Usuarios y total
   */
  async findByCriteria(criteria = {}, options = { skip: 0, take: 10 }) {
    const where = {};

    if (criteria.name) {
      where.name = { contains: criteria.name };
    }

    if (criteria.email) {
      where.email = { contains: criteria.email.toLowerCase() };
    }

    if (criteria.isActive !== undefined) {
      where.isActive = criteria.isActive;
    }

    const [users, total] = await Promise.all([
      this._prisma.user.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: 'desc' }
      }),
      this._prisma.user.count({ where })
    ]);

    return {
      users: users.map(userData => User.reconstitute(userData)),
      total
    };
  }
}

module.exports = { UserRepository };