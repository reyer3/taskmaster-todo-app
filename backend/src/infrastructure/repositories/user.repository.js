/**
 * Implementación de repositorio para Usuarios
 */
const { prisma } = require('../database/prisma-client');

class UserRepository {
  /**
   * Encuentra un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object|null>} Objeto User o null si no existe
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id }
    });
  }
  
  /**
   * Encuentra un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Objeto User o null si no existe
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }
  
  /**
   * Crea un nuevo usuario
   * @param {Object} user - Objeto User a crear
   * @returns {Promise<Object>} Usuario creado
   */
  async create(user) {
    return prisma.user.create({
      data: user
    });
  }
  
  /**
   * Actualiza un usuario existente
   * @param {Object} user - Objeto User con datos actualizados
   * @returns {Promise<Object>} Usuario actualizado
   */
  async update(user) {
    const { id, ...data } = user;
    
    return prisma.user.update({
      where: { id },
      data
    });
  }
  
  /**
   * Verifica si existe un usuario con el email dado
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} true si existe, false si no
   */
  async existsByEmail(email) {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() }
    });
    
    return count > 0;
  }
}

module.exports = { UserRepository };
