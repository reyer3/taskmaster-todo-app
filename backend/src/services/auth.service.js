/**
 * Servicio para autenticación y gestión de usuarios (capa de aplicación)
 * Implementa casos de uso relacionados con usuarios y autenticación
 */
const jwt = require('jsonwebtoken');
const {
  User,
  ValidationError,
  BusinessRuleViolationError
} = require('../domain/auth/user.model.js');

// Importamos los errores de aplicación desde app-error.js
const {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ValidationError: AppValidationError
} = require('../utils/errors/app-error');

class AuthService {
  // Constantes de clase para mensajes de error comunes
  static ERROR_MESSAGES = {
    EMAIL_EXISTS: 'El email ya está registrado',
    EMAIL_IN_USE: 'El email ya está en uso',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    USER_INACTIVE: 'La cuenta de usuario está desactivada',
    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_TOKEN: 'Token inválido o expirado',
    DISABLED_TOKEN: 'Token inválido o usuario desactivado'
  };

  constructor(userRepository, config = {}) {
    this.userRepository = userRepository;
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET || 'dev_secret';
    this.jwtExpiresIn = config.jwtExpiresIn || '1d';
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn || '7d';
  }

  /**
   * Método alternativo de inicialización para facilitar la inyección de dependencias
   * @param {Object} dependencies - Dependencias del servicio
   * @param {Object} config - Configuración del servicio
   * @returns {AuthService} Instancia del servicio
   */
  static initialize(dependencies, config = {}) {
    return new AuthService(dependencies.userRepository, config);
  }

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del nuevo usuario
   * @returns {Promise<Object>} Objeto con usuario y tokens
   * @throws {ConflictError} Si el email ya está registrado
   * @throws {ValidationError} Si los datos son inválidos
   */
  async register(userData) {
    try {
      await this._validateEmailNotRegistered(userData.email);

      // Crear entidad de usuario usando el factory method del dominio
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      // Guardar usuario
      const createdUser = await this.userRepository.create(user);

      // Generar tokens y devolver respuesta
      return this._createAuthResponse(createdUser);
    } catch (error) {
      this._handleServiceError(error, 'Error al registrar usuario');
    }
  }

  /**
   * Inicia sesión de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Objeto con usuario y tokens
   * @throws {AuthenticationError} Si las credenciales son incorrectas
   * @throws {AuthorizationError} Si el usuario está inactivo
   */
  async login(email, password) {
    try {
      const user = await this._findAndValidateUser(email);
      await this._validatePassword(user, password);

      return this._createAuthResponse(user);
    } catch (error) {
      this._handleServiceError(error, 'Error al iniciar sesión', AuthenticationError);
    }
  }

  /**
   * Renueva un token de acceso usando un token de refresco
   * @param {string} refreshToken - Token de refresco
   * @returns {Promise<Object>} Objeto con nuevo token de acceso
   * @throws {AuthenticationError} Si el token es inválido
   */
  async refreshToken(refreshToken) {
    try {
      // Verificar y decodificar el token de refresco
      const decoded = this._verifyRefreshToken(refreshToken);

      // Verificar que el usuario existe y está activo
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.canLogin()) {
        // Cuando usamos _handleServiceError con null, ya lanzará una excepción,
        // no debemos continuar con el código siguiente
        this._handleServiceError(
            null,
            AuthService.ERROR_MESSAGES.DISABLED_TOKEN,
            AuthenticationError
        );
        // Debido a que _handleServiceError lanza una excepción, este código nunca se ejecutará
        // Por lo tanto, es mejor usar un return explícito para claridad:
        return; // Esta línea nunca se ejecutará, pero ayuda a la comprensión del código
      }

      // Generar nuevo token de acceso
      const accessToken = this._generateAccessToken(user);
      return {accessToken};
    } catch (error) {
      this._handleServiceError(error, 'Error al renovar token', AuthenticationError);
    }
  }


  /**
   * Obtiene un usuario por su ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos seguros del usuario
   * @throws {NotFoundError} Si el usuario no existe
   */
  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(AuthService.ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user.toDTO();
  }

  /**
   * Actualiza los datos de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Datos actualizados del usuario
   * @throws {NotFoundError} Si el usuario no existe
   * @throws {ConflictError} Si el email ya está en uso
   */
  async updateUser(userId, updates) {
    try {
      const user = await this._findUserById(userId);

      // Verificar nuevo email si se intenta cambiar
      if (updates.email && updates.email !== user.email) {
        await this._validateEmailNotRegistered(updates.email, AuthService.ERROR_MESSAGES.EMAIL_IN_USE);
      }

      // Usar el método del dominio para actualizar
      user.update(updates);

      // Guardar cambios
      const updatedUser = await this.userRepository.update(user);
      return updatedUser.toDTO();
    } catch (error) {
      this._handleServiceError(error, 'Error al actualizar usuario');
    }
  }


  /**
   * Verifica un token de acceso
   * @param {string} token - Token de acceso a verificar
   * @returns {Object} Payload decodificado del token
   * @throws {AuthenticationError} Si el token es inválido o ha expirado
   */
  async verifyToken(token) {
    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, this.jwtSecret);

      // Verificar que el usuario existe y está activo
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.canLogin()) {
        this._handleServiceError(
            null,
            AuthService.ERROR_MESSAGES.DISABLED_TOKEN,
            AuthenticationError
        );
      }

      return decoded;
    } catch (error) {
      // Manejar errores específicos de JWT
      if (error instanceof jwt.TokenExpiredError) {
        this._handleServiceError(
            error,
            'Token expirado',
            AuthenticationError
        );
      } else if (error instanceof jwt.JsonWebTokenError) {
        this._handleServiceError(
            error,
            'Token inválido',
            AuthenticationError
        );
      }

      // Para cualquier otro tipo de error
      this._handleServiceError(
          error,
          'Error al verificar token',
          AuthenticationError
      );
    }
  }

  /**
   * Cambia la contraseña de un usuario
   * @param {string} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} true si el cambio fue exitoso
   * @throws {NotFoundError} Si el usuario no existe
   * @throws {AuthenticationError} Si la contraseña actual es incorrecta
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this._findUserById(userId);
      await this._validatePassword(user, currentPassword);

      await user.changePassword(currentPassword, newPassword);
      await this.userRepository.update(user);

      return true;
    } catch (error) {
      this._handleServiceError(error, 'Error al cambiar contraseña');
    }
  }

  // Métodos privados de ayuda

  _createAuthResponse(user) {
    const {accessToken, refreshToken} = this._generateTokens(user);
    return {
      user: user.toDTO(),
      accessToken,
      refreshToken
    };
  }

  _generateTokens(user) {
    const accessToken = this._generateAccessToken(user);
    const refreshToken = jwt.sign(
        {id: user.id},
        this.jwtSecret,
        {expiresIn: this.refreshTokenExpiresIn}
    );

    return {accessToken, refreshToken};
  }

  _generateAccessToken(user) {
    return jwt.sign(
        {id: user.id, email: user.email},
        this.jwtSecret,
        {expiresIn: this.jwtExpiresIn}
    );
  }

  _verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      // Convertir errores específicos de JWT a nuestro formato de error
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Token inválido');
      }
      throw error;
    }
  }

  async _validateEmailNotRegistered(email, errorMessage = AuthService.ERROR_MESSAGES.EMAIL_EXISTS) {
    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      throw new ConflictError(errorMessage);
    }
  }

  async _findUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(AuthService.ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  async _findAndValidateUser(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError(AuthService.ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.canLogin()) {
      throw new AuthorizationError(AuthService.ERROR_MESSAGES.USER_INACTIVE);
    }

    return user;
  }

  async _validatePassword(user, password) {
    try {
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        this._handleServiceError(
            null,
            AuthService.ERROR_MESSAGES.INVALID_CREDENTIALS,
            AuthenticationError
        );

      }
    } catch (error) {
      // Usar _handleServiceError para manejar todos los tipos de errores consistentemente
      this._handleServiceError(
          error,
          AuthService.ERROR_MESSAGES.INVALID_CREDENTIALS,
          AuthenticationError
      );
    }
  }

  _handleServiceError(error, message, ErrorClass = AppError) {
    // Si se pasa null o undefined como error, crear uno nuevo
    if (!error) {
      throw new ErrorClass(message);
    }

    // Manejar diferentes tipos de errores
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof ValidationError) {
      throw new AppValidationError(error.message);
    } else if (error instanceof BusinessRuleViolationError) {
      // Añadir manejo específico para errores de reglas de negocio
      throw new AppError(error.message, 422, 'BUSINESS_RULE_ERROR');
    } else {
      console.error(`Error en ${this.constructor.name}:`, error);
      const appError = new ErrorClass(message, 500);
      appError.cause = error;
      throw appError;
    }
  }

}

module.exports = { AuthService };