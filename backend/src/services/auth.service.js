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

// Importar el sistema de eventos
const { eventPublisher, eventTypes } = require('../infrastructure/events');
const { UserEvents } = eventTypes;

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
    this.eventPublisher = config.eventPublisher || eventPublisher;
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
   * @throws {AppError} Si ocurre cualquier otro error durante el proceso
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
      
      // Generar tokens y preparar respuesta
      const authResponse = this._createAuthResponse(createdUser);
      
      // Publicar evento de registro de usuario
      try {
        await this.eventPublisher.publish(UserEvents.REGISTERED, {
          userId: createdUser.id,
          email: createdUser.email,
          timestamp: new Date().toISOString()
        });
      } catch (eventError) {
        // Registrar error pero no interrumpir el flujo principal
        console.error('Error al publicar evento de registro:', eventError);
      }

      return authResponse;
    } catch (error) {
      // Convertir y lanzar el error - siempre termina la ejecución del método
      throw this._convertServiceError(error, 'Error al registrar usuario');
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
      
      try {
        await this._validatePassword(user, password);
        
        // Generar tokens y preparar respuesta
        const authResponse = this._createAuthResponse(user);
        
        // Publicar evento de inicio de sesión exitoso (con manejo seguro de errores)
        try {
          await this.eventPublisher.publish(UserEvents.LOGIN_SUCCESS, {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          });
        } catch (eventError) {
          console.error('Error al publicar evento de login exitoso:', eventError);
          // No interrumpir el flujo principal si falla la publicación del evento
        }
        
        return authResponse;
      } catch (error) {
        // Publicar evento de inicio de sesión fallido (con manejo seguro de errores)
        try {
          await this.eventPublisher.publish(UserEvents.LOGIN_FAILED, {
            email,
            reason: 'invalid_password',
            timestamp: new Date().toISOString()
          });
        } catch (eventError) {
          console.error('Error al publicar evento de login fallido:', eventError);
        }
        
        // Re-lanzar el error original con el formato correcto
        throw this._convertServiceError(error, 'Credenciales inválidas', AuthenticationError);
      }
    } catch (error) {
      // Manejar el evento de usuario no encontrado
      if (error instanceof AuthenticationError) {
        try {
          await this.eventPublisher.publish(UserEvents.LOGIN_FAILED, {
            email,
            reason: 'user_not_found',
            timestamp: new Date().toISOString()
          });
        } catch (eventError) {
          console.error('Error al publicar evento de usuario no encontrado:', eventError);
        }
      }
      
      // Uso claro y explícito: convertir y lanzar el error
      throw this._convertServiceError(error, 'Error al iniciar sesión', AuthenticationError);
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
        // Enfoque más claro: convertir el error y lanzarlo explícitamente
        throw this._convertServiceError(
            null,
            AuthService.ERROR_MESSAGES.DISABLED_TOKEN,
            AuthenticationError
        );
      }

      // Generar nuevo token de acceso
      const accessToken = this._generateAccessToken(user);
      return {accessToken};
    } catch (error) {
      // Uso explícito y claro del patrón de conversión y lanzamiento de errores
      throw this._convertServiceError(error, 'Error al renovar token', AuthenticationError);
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
      const originalEmail = user.email;

      // Verificar nuevo email si se intenta cambiar
      if (updates.email && updates.email !== user.email) {
        await this._validateEmailNotRegistered(updates.email, AuthService.ERROR_MESSAGES.EMAIL_IN_USE);
      }

      // Usar el método del dominio para actualizar
      user.update(updates);

      // Guardar cambios
      const updatedUser = await this.userRepository.update(user);
      
      // Publicar evento de actualización de usuario (con manejo seguro de errores)
      try {
        await this.eventPublisher.publish(UserEvents.UPDATED, {
          userId: updatedUser.id,
          changes: Object.keys(updates),
          emailChanged: updates.email && updates.email !== originalEmail,
          timestamp: new Date().toISOString()
        });
      } catch (eventError) {
        console.error('Error al publicar evento de actualización de usuario:', eventError);
      }
      
      return updatedUser.toDTO();
    } catch (error) {
      throw this._convertServiceError(error, 'Error al actualizar usuario');
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
        throw this._convertServiceError(
            null,
            AuthService.ERROR_MESSAGES.DISABLED_TOKEN,
            AuthenticationError
        );
      }

      return decoded;
    } catch (error) {
      // Manejar errores específicos de JWT
      if (error instanceof jwt.TokenExpiredError) {
        throw this._convertServiceError(
            error,
            'Token expirado',
            AuthenticationError
        );
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw this._convertServiceError(
            error,
            'Token inválido',
            AuthenticationError
        );
      }

      // Para cualquier otro tipo de error
      throw this._convertServiceError(
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
      
      // Publicar evento de cambio de contraseña (con manejo seguro de errores)
      try {
        await this.eventPublisher.publish(UserEvents.PASSWORD_CHANGED, {
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      } catch (eventError) {
        console.error('Error al publicar evento de cambio de contraseña:', eventError);
      }

      return true;
    } catch (error) {
      throw this._convertServiceError(error, 'Error al cambiar contraseña');
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
        throw this._convertServiceError(
            null,
            AuthService.ERROR_MESSAGES.INVALID_CREDENTIALS,
            AuthenticationError
        );
      }
    } catch (error) {
      // Uso consistente del patrón de conversión y lanzamiento de errores
      throw this._convertServiceError(
          error,
          AuthService.ERROR_MESSAGES.INVALID_CREDENTIALS,
          AuthenticationError
      );
    }
  }

  /**
   * Convierte errores al formato estandarizado de la aplicación
   * @param {Error|null} error - Error original o null
   * @param {string} message - Mensaje para usar si no hay error o necesita envolverse
   * @param {typeof AppError} ErrorClass - Clase de error a usar si se necesita crear uno nuevo
   * @returns {AppError} Error convertido al formato de la aplicación
   * @private
   */
  _convertServiceError(error, message, ErrorClass = AppError) {
    // Si se pasa null o undefined como error, crear uno nuevo
    if (!error) {
      return new ErrorClass(message);
    }

    // Manejar diferentes tipos de errores
    if (error instanceof AppError) {
      return error;
    } else if (error instanceof ValidationError) {
      return new AppValidationError(error.message);
    } else if (error instanceof BusinessRuleViolationError) {
      // Añadir manejo específico para errores de reglas de negocio
      return new AppError(error.message, 422, 'BUSINESS_RULE_ERROR');
    } else {
      console.error(`Error en ${this.constructor.name}:`, error);
      const appError = new ErrorClass(message, 500);
      appError.cause = error;
      return appError;
    }
  }
  
  /**
   * Convierte y lanza un error (método de ayuda que siempre termina la ejecución)
   * @param {Error|null} error - Error original o null
   * @param {string} message - Mensaje para usar si no hay error o necesita envolverse
   * @param {typeof AppError} ErrorClass - Clase de error a usar si se necesita crear uno nuevo
   * @throws {AppError} Siempre lanza el error convertido
   * @deprecated Este método será eliminado en versiones futuras, usar 'throw _convertServiceError()' en su lugar
   * @private
   */
  _handleServiceError(error, message, ErrorClass = AppError) {
    throw this._convertServiceError(error, message, ErrorClass);
  }

}

module.exports = { AuthService };