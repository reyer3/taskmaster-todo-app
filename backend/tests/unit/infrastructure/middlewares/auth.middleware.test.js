/**
 * Pruebas unitarias para middleware de autenticación
 */
// Definir el mock antes de importar
const mockAuthService = {
  verifyToken: jest.fn(),
};

// Mock para AuthService
jest.mock('../../../../src/services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService)
}), {virtual: true});

// Mock para UserRepository
jest.mock('../../../../src/infrastructure/repositories/user.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({}))
}), {virtual: true});

const { authMiddleware, adminMiddleware } = require('../../../../src/infrastructure/middlewares/auth.middleware');
const { AuthenticationError, AuthorizationError } = require('../../../../src/utils/errors/app-error');

describe('Auth Middleware', () => {
  // Objetos mock para req, res, next
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup objetos mock
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  describe('authMiddleware', () => {
    it('debería pasar al siguiente middleware si el token es válido', async () => {
      // Mock usuario autenticado
      const mockUser = { id: 'user123', email: 'test@example.com' };
      mockAuthService.verifyToken.mockResolvedValue(mockUser);
      
      // Setup token en headers
      req.headers.authorization = 'Bearer valid_token';
      
      // Ejecutar middleware
      await authMiddleware(req, res, next);
      
      // Verificaciones
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid_token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('debería devolver error si no hay token de autenticación', async () => {
      // Ejecutar middleware
      await authMiddleware(req, res, next);
      
      // Verificaciones
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      
      // Verificar que se pasó un error de autenticación
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toContain('No se proporcionó token');
    });

    it('debería devolver error si el header Authorization no tiene el formato correcto', async () => {
      // Header en formato incorrecto
      req.headers.authorization = 'InvalidFormat';
      
      // Ejecutar middleware
      await authMiddleware(req, res, next);
      
      // Verificaciones
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      
      // Verificar que se pasó un error de autenticación
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('debería manejar errores del AuthService', async () => {
      // Simular error en verificación de token
      mockAuthService.verifyToken.mockRejectedValue(new Error('Token verification failed'));
      
      // Setup token en headers
      req.headers.authorization = 'Bearer invalid_token';
      
      // Ejecutar middleware
      await authMiddleware(req, res, next);
      
      // Verificaciones
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('invalid_token');
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('adminMiddleware', () => {
    it('debería pasar al siguiente middleware si el usuario es admin', () => {
      // Setup de usuario admin
      req.user = {
        id: 'admin123',
        role: 'admin'
      };
      
      // Ejecutar middleware
      adminMiddleware(req, res, next);
      
      // Verificaciones
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('debería devolver error si no hay usuario autenticado', () => {
      // Ejecutar middleware
      adminMiddleware(req, res, next);
      
      // Verificaciones
      expect(next).toHaveBeenCalledTimes(1);
      
      // Verificar que se pasó un error de autenticación
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toContain('Se requiere autenticación');
    });

    it('debería devolver error si el usuario no tiene rol de admin', () => {
      // Setup de usuario no admin
      req.user = {
        id: 'user123',
        role: 'user'
      };
      
      // Ejecutar middleware
      adminMiddleware(req, res, next);
      
      // Verificaciones
      expect(next).toHaveBeenCalledTimes(1);
      
      // Verificar que se pasó un error de autorización
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toContain('privilegios de administrador');
    });
  });
});
