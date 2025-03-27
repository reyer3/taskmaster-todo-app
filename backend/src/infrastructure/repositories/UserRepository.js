/**
 * Implementación de repositorio para Usuarios
 */
const { prisma } = require('../database/prismaClient');
const { User } = require('../../domain/auth/User');

class UserRepository {
  /**
   * Encuentra un usuario por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>} Objeto User o null si no existe
   */
  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) return null;
    
    return new User(user);
  }
  
  /**
   * Encuentra un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<User|null>} Objeto User o null si no existe
   */
  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) return null;
    
    return new User(user);
  }
  
  /**
   * Crea un nuevo usuario
   * @param {User} user - Objeto User a crear
   * @returns {Promise<User>} Usuario creado
   */
  async create(user) {
    const created = await prisma.user.create({
      data: user.toJSON()
    });
    
    return new User(created);
  }
  
  /**
   * Actualiza un usuario existente
   * @param {User} user - Objeto User con datos actualizados
   * @returns {Promise<User>} Usuario actualizado
   */
  async update(user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: user.toJSON()
    });
    
    return new User(updated);
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
