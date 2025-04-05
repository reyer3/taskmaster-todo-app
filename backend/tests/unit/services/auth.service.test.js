/**
 * Pruebas unitarias para AuthService
 */
const { AuthService } = require('../../../src/services/auth.service');
const jwt = require('jsonwebtoken');

// Importar errores de aplicación
const { 
  AppError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError
} = require('../../../src/utils/errors/app-error');

// Mock para UserRepository
const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  existsByEmail: jest.fn()
};

// Mock para eventPublisher
const mockEventPublisher = {
  publish: jest.fn().mockResolvedValue(true)
};

// Mock para jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation(() => 'mock_token'),
  verify: jest.fn().mockImplementation(() => ({ id: 'user123', email: 'test@example.com' })),
  JsonWebTokenError: class JsonWebTokenError extends Error {},
  TokenExpiredError: class TokenExpiredError extends Error {}
}));

// Mock para la clase User - usando mockValidationError en lugar de ValidationError
jest.mock('../../../src/domain/auth/user.model', () => {
  // Creamos errores personalizados para usar en los mocks
  const mockValidationError = class MockValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  };
  
  const mockBusinessRuleViolationError = class MockBusinessRuleViolationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'BusinessRuleViolationError';
    }
  };
  
  return {
    User: {
      create: jest.fn().mockImplementation(async (userData) => {
        if (userData.password && !userData.password.match(/[A-Z]/)) {
          throw new mockValidationError('La contraseña debe contener al menos una letra mayúscula');
        }
        return {
          id: 'user123',
          email: userData.email,
          name: userData.name,
          canLogin: jest.fn().mockReturnValue(true),
          verifyPassword: jest.fn().mockImplementation(async (password) => {
            return password === 'Password123';
          }),
          toDTO: jest.fn().mockReturnValue({
            id: 'user123',
            email: userData.email,
            name: userData.name
          })
        };
      })
    },
    ValidationError: mockValidationError,
    BusinessRuleViolationError: mockBusinessRuleViolationError
  };
});

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    // Reset de todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Configurar el entorno de prueba
    process.env.NODE_ENV = 'test';

    // Crear una nueva instancia para cada test
    authService = new AuthService(mockUserRepository, {
      eventPublisher: mockEventPublisher
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      // Setup de mocks
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.create.mockImplementation((user) => {
        user.id = 'user123';
        user.toDTO = jest.fn().mockReturnValue({
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        });
        return Promise.resolve(user);
      });

      // Datos de entrada con contraseña válida
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      // Ejecución del método
      const result = await authService.register(userData);

      // Verificaciones
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledTimes(2); // Una para accessToken, otra para refreshToken
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.registered', 
        expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com'
        })
      );
      
      // Verificar estructura del resultado
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', 'user123');
      expect(result.user).toHaveProperty('email', 'test@example.com');
    });

    it('debería lanzar error si el email ya está en uso', async () => {
      // Setup de mocks
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Datos de entrada
      const userData = {
        email: 'already@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      // Verificar que lanza un error
      await expect(authService.register(userData)).rejects.toThrow('Email already in use');
      
      // Verificaciones adicionales
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith('already@example.com');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('debería lanzar error si la contraseña no cumple los requisitos', async () => {
      // Setup de mocks
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Datos de entrada con contraseña inválida (sin mayúscula)
      const userData = {
        email: 'test@example.com',
        password: 'password123', // sin mayúscula
        name: 'Test User',
      };

      // Verificar que lanza un error
      await expect(authService.register(userData)).rejects.toThrow('La contraseña debe contener al menos una letra mayúscula');
    });
  });

  describe('login', () => {
    it('debería autenticar correctamente y retornar tokens', async () => {
      // Setup de mocks
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        canLogin: jest.fn().mockReturnValue(true),
        verifyPassword: jest.fn().mockResolvedValue(true),
        toDTO: jest.fn().mockReturnValue({
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        })
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Ejecución del método
      const result = await authService.login('test@example.com', 'Password123');

      // Verificaciones
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.verifyPassword).toHaveBeenCalledWith('Password123');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.login_success', 
        expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com'
        })
      );
      
      // Verificar estructura del resultado
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('debería lanzar error si el usuario no existe', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Verificar que lanza un error
      await expect(authService.login('nonexistent@example.com', 'Password123'))
        .rejects.toThrow('Invalid email or password');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.login_failed', 
        expect.objectContaining({
          email: 'nonexistent@example.com',
          reason: 'user_not_found'
        })
      );
    });

    it('debería lanzar error si la contraseña es incorrecta', async () => {
      // Setup de mocks
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        canLogin: jest.fn().mockReturnValue(true),
        verifyPassword: jest.fn().mockResolvedValue(false)
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Verificar que lanza un error
      await expect(authService.login('test@example.com', 'WrongPassword'))
        .rejects.toThrow('Invalid email or password');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.verifyPassword).toHaveBeenCalledWith('WrongPassword');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.login_failed', 
        expect.objectContaining({
          email: 'test@example.com',
          reason: 'invalid_password'
        })
      );
    });

    it('debería lanzar error si la cuenta está desactivada', async () => {
      // Setup de mocks
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        canLogin: jest.fn().mockReturnValue(false)
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Verificar que lanza un error
      await expect(authService.login('test@example.com', 'Password123'))
        .rejects.toThrow('Account is inactive');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.canLogin).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('debería verificar un token JWT correctamente', async () => {
      // Setup de mocks
      jwt.verify.mockReturnValue({ id: 'user123', email: 'test@example.com' });
      
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        canLogin: jest.fn().mockReturnValue(true)
      };
      
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Ejecución del método
      const result = await authService.verifyToken('valid_token');

      // Verificaciones
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      
      // En modo test, no debería verificar el usuario en la BD
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      
      // Verificar resultado
      expect(result).toHaveProperty('id', 'user123');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('debería manejar tokens inválidos', async () => {
      // Setup para simular un token inválido
      jwt.verify.mockImplementationOnce(() => {
        const error = new jwt.JsonWebTokenError('Invalid token');
        throw error;
      });

      // Verificar que maneja correctamente el error
      await expect(authService.verifyToken('invalid_token'))
        .rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('debería renovar el token correctamente', async () => {
      // Setup de mocks
      jwt.verify.mockReturnValue({ id: 'user123' });
      
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        canLogin: jest.fn().mockReturnValue(true)
      };
      
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Ejecución del método
      const result = await authService.refreshToken('valid_refresh_token');

      // Verificaciones
      expect(jwt.verify).toHaveBeenCalledWith('valid_refresh_token', expect.any(String));
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
      expect(jwt.sign).toHaveBeenCalled();
      
      // Verificar resultado
      expect(result).toHaveProperty('accessToken');
    });
  });
});
