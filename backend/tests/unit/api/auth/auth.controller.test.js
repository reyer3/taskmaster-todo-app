/**
 * Pruebas unitarias para auth.controller.js
 */
const express = require('express');
const request = require('supertest');
const { describe, it, beforeEach, expect } = require('@jest/globals');
const { ValidationError, AppError } = require('../../../../src/utils/errors/app-error');

// Configuración de mocks
// Mock para el servicio de autenticación
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  changePassword: jest.fn()
};

jest.mock('../../../../src/services/auth.service', () => {
  return {
    AuthService: function() {
      return mockAuthService;
    }
  };
});

// Mock para el middleware de autenticación
jest.mock('../../../../src/infrastructure/middlewares/auth.middleware', () => ({
  authMiddleware: function(req, res, next) {
    req.user = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
    next();
  }
}));

// Mock para el convertidor de errores
jest.mock('../../../../src/utils/errors/error-converter', () => ({
  convertToAppError: jest.fn(err => err)
}));

// Mock para el repositorio
jest.mock('../../../../src/infrastructure/repositories/user.repository', () => ({
  UserRepository: function() {
    return {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };
  }
}));

// Importar el controlador después de configurar todos los mocks
const authController = require('../../../../src/api/auth/auth.controller');

describe('Auth Controller', () => {
  let app;
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar Express para las pruebas
    app = express();
    app.use(express.json());
    
    // Configurar cookies
    app.use((req, res, next) => {
      res.cookie = jest.fn().mockReturnValue(res);
      res.clearCookie = jest.fn().mockReturnValue(res);
      next();
    });
    
    // Montar el controlador
    app.use('/api/auth', authController);
    
    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      let statusCode = 500;
      let responseBody = {
        status: 'error',
        message: err.message || 'Error interno del servidor'
      };
      
      if (err instanceof ValidationError) {
        statusCode = 400;
        responseBody.errors = err.errors;
      } else if (err instanceof AppError) {
        statusCode = err.statusCode || 500;
      }
      
      res.status(statusCode).json(responseBody);
    });
  });

  describe('POST /register', () => {
    it('debería registrar un usuario correctamente', async () => {
      // Mock de datos de respuesta
      const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      });
      
      // Realizar la solicitud
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User'
        })
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: mockUser,
          accessToken: 'access-token-123'
        },
        message: 'Usuario registrado exitosamente'
      });
      
      // Verificar que se llamó al servicio
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      });
    });
    
    it('debería manejar errores de validación', async () => {
      // Datos inválidos
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          name: ''
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verificar respuesta
      expect(response.body.status).toBe('error');
      expect(response.body).toHaveProperty('errors');
      
      // Verificar que no se llamó al servicio
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('POST /login', () => {
    it('debería autenticar correctamente a un usuario', async () => {
      // Mock de datos de respuesta
      const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      });
      
      // Realizar la solicitud
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: mockUser,
          accessToken: 'access-token-123'
        },
        message: 'Inicio de sesión exitoso'
      });
      
      // Verificar que se llamó al servicio
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
    
    it('debería manejar errores de validación', async () => {
      // Datos inválidos
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: ''
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verificar respuesta
      expect(response.body.status).toBe('error');
      expect(response.body).toHaveProperty('errors');
      
      // Verificar que no se llamó al servicio
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('GET /me', () => {
    it('debería obtener el perfil del usuario autenticado', async () => {
      // Mock de datos de respuesta
      const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      mockAuthService.getUserById.mockResolvedValue(mockUser);
      
      // Realizar la solicitud
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        data: mockUser
      });
      
      // Verificar que se llamó al servicio
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-123');
    });
  });

  describe('PUT /me', () => {
    it('debería actualizar el perfil del usuario', async () => {
      // Mock de datos de respuesta
      const mockUpdatedUser = { 
        id: 'user-123', 
        email: 'updated@example.com',
        name: 'Updated Name' 
      };
      mockAuthService.updateUser.mockResolvedValue(mockUpdatedUser);
      
      // Realizar la solicitud
      const response = await request(app)
        .put('/api/auth/me')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        data: mockUpdatedUser
      });
      
      // Verificar que se llamó al servicio
      expect(mockAuthService.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
      );
    });
    
    it('debería manejar errores de validación', async () => {
      // Datos inválidos
      const response = await request(app)
        .put('/api/auth/me')
        .send({
          name: '',
          email: 'invalid-email'
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verificar respuesta
      expect(response.body.status).toBe('error');
      
      // Verificar que no se llamó al servicio
      expect(mockAuthService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /change-password', () => {
    it('debería cambiar la contraseña del usuario', async () => {
      // Mock del servicio
      mockAuthService.changePassword.mockResolvedValue(true);
      
      // Realizar la solicitud
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'CurrentPass123',
          newPassword: 'NewPass123'
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        message: 'Contraseña cambiada correctamente'
      });
      
      // Verificar que se llamó al servicio
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'CurrentPass123',
        'NewPass123'
      );
    });
    
    it('debería manejar errores de validación', async () => {
      // Datos inválidos
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: '',
          newPassword: 'short'
        })
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verificar respuesta
      expect(response.body.status).toBe('error');
      
      // Verificar que no se llamó al servicio
      expect(mockAuthService.changePassword).not.toHaveBeenCalled();
    });
  });

  describe('POST /refresh-token', () => {
    it('debería renovar el token de acceso', async () => {
      // Mock del servicio
      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token-123'
      });
      
      // Realizar la solicitud
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'valid-refresh-token'
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        data: {
          accessToken: 'new-access-token-123'
        },
        message: 'Token renovado exitosamente'
      });
      
      // Verificar que se llamó al servicio
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
    
    it('debería manejar refresh token no proporcionado', async () => {
      // Realizar la solicitud sin token
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verificar respuesta
      expect(response.body.status).toBe('error');
      
      // Verificar que no se llamó al servicio
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('POST /logout', () => {
    it('debería cerrar la sesión del usuario', async () => {
      // Realizar la solicitud
      const response = await request(app)
        .post('/api/auth/logout')
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verificar respuesta
      expect(response.body).toEqual({
        status: 'success',
        message: 'Sesión cerrada exitosamente'
      });
    });
  });
});
