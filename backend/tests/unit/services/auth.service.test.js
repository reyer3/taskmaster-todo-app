/**
 * Pruebas unitarias para AuthService
 */
const { AuthService } = require('../../../src/services/auth.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock para UserRepository
const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

// Mock para bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: jest.fn(),
}));

// Mock para jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation(() => 'mock_token'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    // Reset de todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Crear una nueva instancia para cada test
    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      });

      // Datos de entrada
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Ejecución del método
      const result = await authService.register(userData);

      // Verificaciones
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledTimes(2); // Una para accessToken, otra para refreshToken
      
      // Verificar estructura del resultado
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', 'user123');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('debería lanzar error si el email ya está en uso', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing123',
        email: 'test@example.com',
      });

      // Datos de entrada
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Verificar que lanza un error
      await expect(authService.register(userData)).rejects.toThrow('Email already in use');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('debería autenticar correctamente y retornar tokens', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        isActive: true,
      });
      
      bcrypt.compare.mockResolvedValue(true);

      // Ejecución del método
      const result = await authService.login('test@example.com', 'password123');

      // Verificaciones
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      
      // Verificar estructura del resultado
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', 'user123');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('debería lanzar error si el usuario no existe', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Verificar que lanza un error
      await expect(authService.login('nonexistent@example.com', 'any_password'))
        .rejects.toThrow('Invalid email or password');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('debería lanzar error si la contraseña es incorrecta', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: true,
      });
      
      bcrypt.compare.mockResolvedValue(false);

      // Verificar que lanza un error
      await expect(authService.login('test@example.com', 'wrong_password'))
        .rejects.toThrow('Invalid email or password');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });

    it('debería lanzar error si la cuenta está desactivada', async () => {
      // Setup de mocks
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: false,
      });

      // Verificar que lanza un error
      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('Account is inactive');
      
      // Verificaciones adicionales
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('debería verificar un token JWT y retornar los datos del usuario', async () => {
      // Setup de mocks
      const decodedToken = { id: 'user123', email: 'test@example.com' };
      jwt.verify.mockImplementation(() => decodedToken);
      mockUserRepository.findById.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
      });

      // Ejecución del método
      const result = await authService.verifyToken('valid_token');

      // Verificaciones
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
      
      // Verificar resultado
      expect(result).toHaveProperty('id', 'user123');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('debería lanzar error si el token es inválido', async () => {
      // Setup de mocks
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Verificar que lanza un error
      await expect(authService.verifyToken('invalid_token'))
        .rejects.toThrow('Invalid token');
      
      // Verificaciones adicionales
      expect(jwt.verify).toHaveBeenCalledWith('invalid_token', expect.any(String));
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('debería lanzar error si el usuario no existe', async () => {
      // Setup de mocks
      const decodedToken = { id: 'nonexistent' };
      jwt.verify.mockImplementation(() => decodedToken);
      mockUserRepository.findById.mockResolvedValue(null);

      // Verificar que lanza un error
      await expect(authService.verifyToken('valid_token'))
        .rejects.toThrow('User not found');
      
      // Verificaciones adicionales
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      expect(mockUserRepository.findById).toHaveBeenCalledWith('nonexistent');
    });

    it('debería lanzar error si la cuenta está desactivada', async () => {
      // Setup de mocks
      const decodedToken = { id: 'user123' };
      jwt.verify.mockImplementation(() => decodedToken);
      mockUserRepository.findById.mockResolvedValue({
        id: 'user123',
        isActive: false,
      });

      // Verificar que lanza un error
      await expect(authService.verifyToken('valid_token'))
        .rejects.toThrow('Account is inactive');
      
      // Verificaciones adicionales
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', expect.any(String));
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
    });
  });
});
