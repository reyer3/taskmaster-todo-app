/**
 * Modelo de dominio para Usuario
 * 
 * Este modelo encapsula la lógica de negocio relacionada con los usuarios
 * y sigue el principio de "Tell, Don't Ask"
 */
const bcrypt = require('bcrypt');

/**
 * Modelo de dominio para un usuario
 */
class User {
  /**
   * Constructor de usuario
   * 
   * @param {Object} data - Datos del usuario
   * @param {number} data.id - ID único del usuario
   * @param {string} data.email - Email del usuario
   * @param {string} data.password - Contraseña del usuario (ya hashada o en texto plano)
   * @param {string} data.name - Nombre del usuario
   * @param {Date} data.createdAt - Fecha de creación
   * @param {Date} data.updatedAt - Fecha de última actualización
   * @param {boolean} data.isHashed - Indica si la contraseña ya está hashada
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.isHashed = data.isHashed || false;
    
    this.validate();
  }

  /**
   * Valida que el usuario tenga los datos requeridos
   * @throws {Error} Si la validación falla
   */
  validate() {
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Email inválido');
    }
    
    if (!this.isHashed && (!this.password || this.password.length < 6)) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('El nombre es obligatorio');
    }
  }

  /**
   * Compara una contraseña en texto plano con la contraseña hashada del usuario
   * 
   * @param {string} plainPassword - Contraseña en texto plano para comparar
   * @returns {Promise<boolean>} true si las contraseñas coinciden
   */
  async comparePassword(plainPassword) {
    if (!this.isHashed) {
      return this.password === plainPassword;
    }
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Hashea la contraseña del usuario si no está ya hasheada
   * 
   * @returns {Promise<User>} La instancia actual para encadenamiento
   */
  async hashPassword() {
    if (!this.isHashed && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      this.isHashed = true;
    }
    return this;
  }

  /**
   * Actualiza los datos del usuario
   * 
   * @param {Object} data - Datos a actualizar
   * @param {string} data.name - Nuevo nombre
   * @param {string} data.email - Nuevo email
   * @param {string} data.password - Nueva contraseña (texto plano)
   * @returns {Promise<User>} La instancia actual para encadenamiento
   */
  async update(data) {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    
    if (data.password !== undefined) {
      this.password = data.password;
      this.isHashed = false;
      await this.hashPassword();
    }
    
    this.updatedAt = new Date();
    this.validate();
    
    return this;
  }

  /**
   * Convierte la instancia a un objeto plano seguro (sin contraseña)
   * @returns {Object} Representación del usuario como objeto
   */
  toJSON() {
    // Nunca devolver la contraseña
    const { password, isHashed, ...safeUser } = this;
    return safeUser;
  }

  /**
   * Crea una instancia de User a partir de un objeto y hashea la contraseña
   * 
   * @param {Object} data - Datos para crear el usuario
   * @returns {Promise<User>} Una nueva instancia de User con contraseña hasheada
   */
  static async create(data) {
    const user = new User({ ...data, isHashed: false });
    await user.hashPassword();
    return user;
  }

  /**
   * Crea una instancia de User a partir de datos de la BD (contraseña ya hasheada)
   * 
   * @param {Object} data - Datos del usuario de la BD
   * @returns {User} Una nueva instancia de User
   */
  static fromDatabase(data) {
    return new User({ ...data, isHashed: true });
  }
}

module.exports = User;
