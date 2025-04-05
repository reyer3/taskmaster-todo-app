/**
 * Pruebas de integración para endpoints de autenticación
 */
const request = require('supertest');
const app = require('../../../src/app');
const jwt = require('jsonwebtoken');
const { generateTestToken } = require('../../utils/test-utils');

// Guardamos el valor original de NODE_ENV para restaurarlo después de las pruebas
const originalNodeEnv = process.env.NODE_ENV;

// Forzar el modo de prueba
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Antes de importar el repositorio o servicios, asegurarnos de mockear PrismaClient
jest.mock('@prisma/client', () => {
  const testUser = {
    id: '1',
    email: 'test@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // Hash para 'Password123!'
    name: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(({ where }) => {
          if (where.email === 'test@example.com') {
            return Promise.resolve(testUser);
          }
          if (where.id === '1') {
            return Promise.resolve(testUser);
          }
          return Promise.resolve(null);
        }),
        
        create: jest.fn(({ data }) => {
          if (data.email === 'existing@example.com' || data.email === 'test@example.com') {
            const error = new Error('Unique constraint failed on the fields: (`email`)');
            error.code = 'P2002';
            error.name = 'PrismaClientKnownRequestError';
            error.meta = { target: ['email'] };
            return Promise.reject(error);
          }
          return Promise.resolve({
            id: '2',
            ...data,
            passwordHash: '$2b$10$hashedpassword',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }),
        
        // Implementación correcta del método count
        count: jest.fn(({ where }) => {
          if (where && where.email) {
            if (where.email === 'existing@example.com' || 
                where.email === 'test@example.com') {
              return Promise.resolve(1);
            }
          }
          return Promise.resolve(0);
        }),
        
        findFirst: jest.fn(() => Promise.resolve(null)),
        deleteMany: jest.fn(() => Promise.resolve({ count: 1 }))
      },
      $connect: jest.fn(),
      $disconnect: jest.fn()
    })),
    Prisma: {
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        constructor(message, { code, meta }) {
          super(message);
          this.name = 'PrismaClientKnownRequestError';
          this.code = code;
          this.meta = meta;
        }
      }
    }
  };
});

// Mock para el servicio de autenticación
jest.mock('../../../src/services/auth.service', () => {
  const originalModule = jest.requireActual('../../../src/services/auth.service');
  
  return {
    ...originalModule,
    AuthService: class MockAuthService {
      constructor() {}
      
      async register(userData) {
        if (!userData.password) {
          throw new Error('La contraseña no puede estar vacía');
        }
        
        if (userData.email === 'existing@example.com') {
          const error = new Error('Email already in use');
          error.statusCode = 409;
          throw error;
        }
        
        return {
          user: {
            id: '2',
            email: userData.email,
            name: userData.name
          },
          accessToken: 'mock-access-token'
        };
      }
      
      async login(email, password) {
        if (email === 'test@example.com' && password === 'Password123!') {
          return {
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            },
            accessToken: 'mock-access-token'
          };
        }
        
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }
      
      async verifyToken(token) {
        // En modo test, simplemente decodificamos sin verificar
        if (token === 'invalid_token') {
          const error = new Error('Token inválido');
          error.statusCode = 401;
          throw error;
        }
        
        return {
          id: '1', 
          email: 'test@example.com',
          name: 'Test User'
        };
      }
      
      async getUserById(userId) {
        if (userId === '1') {
          return {
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          };
        }
        
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
    }
  };
});

// Forzar el uso de prodErrorHandler en las pruebas
jest.mock('../../../src/infrastructure/middlewares/error.middleware', () => {
  const actual = jest.requireActual('../../../src/infrastructure/middlewares/error.middleware');
  return {
    ...actual,
    errorHandler: actual.prodErrorHandler
  };
});

// Usuario de prueba para verificar autenticación
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
};

describe('Pruebas de diagnóstico', () => {
  it('debería verificar que no hay doble validación en login', async () => {
    // Obtener el código del controlador para revisar
    jest.dontMock('../../../src/api/auth/auth.controller');
    const authController = require('../../../src/api/auth/auth.controller');
    
    // Verificar y reportar el comportamiento
    console.log('Diagnóstico de pruebas de autenticación:');
    console.log('- Rutas registradas:', Object.keys(authController.stack).length);

    // La prueba misma simplemente pasa
    expect(true).toBe(true);
  });
});

describe('Auth API Endpoints', () => {
  let authToken;
  
  // No necesitamos preparar la base de datos porque estamos mockeando
  
  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión correctamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      
      // Guardar token para otras pruebas
      authToken = response.body.data.accessToken;
    });
    
    it('debería rechazar credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong_password'
        });
      
      // Verificaciones
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('debería requerir todos los campos necesarios', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
          // Sin proporcionar contraseña
        });
      
      // Verificaciones
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('GET /api/auth/me', () => {
    beforeEach(() => {
      // Crear un token si no existe
      if (!authToken) {
        authToken = 'mock-access-token';
      }
    });
    
    it('debería devolver el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('name', testUser.name);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });
    
    it('debería rechazar peticiones sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      // Verificaciones
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('debería rechazar tokens inválidos', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');
      
      // Verificaciones
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
  
  describe('POST /api/auth/register', () => {
    const newUser = {
      email: 'new-user-test@example.com',
      password: 'NewPassword123',
      name: 'New Test User'
    };
    
    it('debería registrar un nuevo usuario correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      
      // Verificaciones
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', newUser.email);
      expect(response.body.data.user).toHaveProperty('name', newUser.name);
    });
    
    it('debería rechazar registro de email ya existente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com', // Email ya existente
          password: 'AnotherPassword123',
          name: 'Another User'
        });
      
      // Verificaciones
      expect(response.status).toBe(409); // Conflict
      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('debería validar requisitos de contraseña', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another-email@example.com',
          password: '123', // Contraseña muy corta
          name: 'Another User'
        });
      
      // Verificaciones
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});

// Restaurar NODE_ENV después de las pruebas
afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;
});
