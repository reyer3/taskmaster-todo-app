/**
 * Pruebas E2E para autenticación
 * 
 * @module tests/e2e/auth.e2e.test
 */
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock para PrismaClient
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      notificationPreference: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn()
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $executeRaw: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([])
    }))
  };
});

// Mock de AuthService de forma directa
jest.mock('../../src/services/auth.service', () => {
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getUserById: jest.fn(),
    verifyToken: jest.fn(),
    changePassword: jest.fn(),
    refreshToken: jest.fn()
  };

  return {
    AuthService: jest.fn().mockImplementation(() => mockAuthService)
  };
});

// Variables para las pruebas
let app;
let server;
let testUser;
let authToken;
let authServiceMock;

// Configuración y limpieza
beforeAll(async () => {
  // Configurar variables de entorno para pruebas
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/taskmaster_test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.PORT = '4001';
  process.env.EMAIL_FROM = 'test@taskmaster.com';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  
  // Crear usuario de prueba
  const userId = uuidv4();
  const passwordHash = await bcrypt.hash('TestPassword123', 10);
  
  testUser = {
    id: userId,
    email: `test-${Date.now()}@example.com`,
    passwordHash,
    name: 'Test User',
    isActive: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Obtener el mock de AuthService
  const { AuthService } = require('../../src/services/auth.service');
  authServiceMock = new AuthService();
  
  // Configurar respuestas del mock
  authServiceMock.login.mockImplementation(async (email, password) => {
    if (email === testUser.email && password === 'TestPassword123') {
      return {
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name
        },
        accessToken: 'mock-token'
      };
    }
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  });
  
  authServiceMock.getUserById.mockImplementation(async (id) => {
    if (id === testUser.id) {
      return {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      };
    }
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  });
  
  authServiceMock.verifyToken.mockImplementation(async (token) => {
    if (token === 'invalid-token') {
      const error = new Error('Token inválido');
      error.statusCode = 401;
      throw error;
    }
    return { id: testUser.id, email: testUser.email };
  });
  
  authServiceMock.register.mockImplementation(async (userData) => {
    if (userData.email === 'existing@example.com') {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }
    
    if (!userData.password || userData.password.length < 8) {
      const error = new Error('La contraseña debe tener al menos 8 caracteres');
      error.statusCode = 400;
      throw error;
    }
    
    return {
      user: {
        id: uuidv4(),
        email: userData.email,
        name: userData.name
      },
      accessToken: 'new-user-token'
    };
  });
  
  authServiceMock.changePassword.mockImplementation(async (userId, currentPassword, newPassword) => {
    if (userId !== testUser.id) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    
    if (currentPassword !== 'TestPassword123') {
      const error = new Error('Contraseña actual incorrecta');
      error.statusCode = 401;
      throw error;
    }
    
    return { success: true };
  });
  
  authServiceMock.refreshToken.mockImplementation(async (token) => {
    if (token === 'invalid-token') {
      const error = new Error('Token inválido');
      error.statusCode = 401;
      throw error;
    }
    return { accessToken: 'refreshed-token' };
  });
  
  // Iniciar servidor
  try {
    // Importar app después de configurar mocks
    const serverPromise = require('../../src/server');
    server = await serverPromise;
    app = server._events.request; // Obtener la app de Express
  } catch (error) {
    console.error('Error iniciando servidor:', error);
  }
  
  // Generar token para pruebas
  authToken = jwt.sign(
    { id: testUser.id, email: testUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  // Limpiar mocks
  jest.clearAllMocks();
  
  // Cerrar servidor
  if (server) {
    await server.close();
  }
});

describe('Autenticación E2E', () => {
  describe('POST /api/auth/login', () => {
    it('debería autenticar usuario correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
    });
    
    it('debería rechazar credenciales inválidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('debería obtener perfil de usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('email');
    });
    
    it('debería rechazar acceso sin token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.status).toBe(401);
    });
    
    it('debería rechazar token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
    });
  });
  
  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario', async () => {
      const newUser = {
        email: `register-test-${Date.now()}@example.com`,
        password: 'NewPassword123',
        name: 'New User'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('email', newUser.email);
    });
    
    it('debería rechazar registro con email existente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123',
          name: 'Existing User'
        });
      
      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
    });
    
    it('debería validar formato de contraseña', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: '123', // Contraseña muy corta
          name: 'New User'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
  
  describe('POST /api/auth/change-password', () => {
    it('debería cambiar contraseña correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'TestPassword123',
          newPassword: 'NewPassword456'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
    
    it('debería rechazar cambio con contraseña actual incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongCurrentPassword',
          newPassword: 'NewPassword789'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });
  
  describe('POST /api/auth/refresh-token', () => {
    it('debería renovar token correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authToken
        });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');
    });
    
    it('debería rechazar token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });
});
