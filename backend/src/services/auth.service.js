/**
 * Servicio para autenticación y gestión de usuarios (capa de aplicación)
 * Implementa casos de uso relacionados con usuarios y autenticación
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} Objeto con usuario y token
   * @throws {Error} Si el email ya está registrado
   */
  async register(userData) {
    // Verificar si el email ya está registrado
    const emailExists = await this.userRepository.existsByEmail(userData.email);
    
    if (emailExists) {
      throw new Error('Email already registered');
    }
    
    // Generar hash de la contraseña
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // Crear entidad de usuario
    const newUser = {
      id: uuidv4(),
      email: userData.email.toLowerCase(),
      passwordHash,
      name: userData.name,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Guardar usuario
    const createdUser = await this.userRepository.create(newUser);
    
    // Generar token JWT
    const token = this._generateToken(createdUser);
    
    // No enviar el passwordHash
    const { passwordHash: _, ...userWithoutPassword } = createdUser;
    
    return {
      user: userWithoutPassword,
      token
    };
  }
  
  /**
   * Inicia sesión de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Objeto con usuario y token
   * @throws {Error} Si las credenciales son incorrectas o el usuario está inactivo
   */
  async login(email, password) {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw new Error('User account is disabled');
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generar token JWT
    const token = this._generateToken(user);
    
    // No enviar el passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  }
  
  /**
   * Obtiene un usuario por su ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos seguros del usuario
   * @throws {Error} Si el usuario no existe
   */
  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // No enviar el passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  }
  
  /**
   * Actualiza los datos de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Datos actualizados del usuario
   * @throws {Error} Si el usuario no existe
   */
  async updateUser(userId, updates) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, updatedAt: new Date() };
    
    // Actualizar campos proporcionados
    if (updates.name) {
      updatedUser.name = updates.name;
    }
    
    if (updates.email) {
      // Verificar si el nuevo email ya existe (si es diferente al actual)
      if (updates.email !== user.email) {
        const emailExists = await this.userRepository.existsByEmail(updates.email);
        
        if (emailExists) {
          throw new Error('Email already in use');
        }
        
        updatedUser.email = updates.email.toLowerCase();
      }
    }
    
    // Guardar cambios
    const result = await this.userRepository.update(updatedUser);
    
    // No enviar el passwordHash
    const { passwordHash: _, ...userWithoutPassword } = result;
    
    return userWithoutPassword;
  }
  
  /**
   * Cambia la contraseña de un usuario
   * @param {string} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} true si el cambio fue exitoso
   * @throws {Error} Si el usuario no existe o la contraseña actual es incorrecta
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Generar hash de la nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    const updatedUser = { 
      ...user, 
      passwordHash: newPasswordHash,
      updatedAt: new Date() 
    };
    
    await this.userRepository.update(updatedUser);
    
    return true;
  }
  
  /**
   * Genera un token JWT para un usuario
   * @private
   * @param {Object} user - Entidad de usuario
   * @returns {string} Token JWT
   */
  _generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '1d' }
    );
  }
  
  /**
   * Verifica y decodifica un token JWT
   * @param {string} token - Token JWT
   * @returns {Object} Payload decodificado
   * @throws {Error} Si el token es inválido o ha expirado
   */
  verifyToken(token) {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev_secret'
      );
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = { AuthService };
