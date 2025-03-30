/**
 * Pruebas de integración para endpoints de autenticación
 */
const request = require('supertest');
const app = require('../../../src/app');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Datos para pruebas
const testUser = {
  email: 'test-integration@example.com',
  password: 'Password123',
  name: 'Test User'
};

// Cliente Prisma para pruebas
const prisma = new PrismaClient();

describe('Auth API Endpoints', () => {
  let authToken;
  
  // Preparar la base de datos antes de las pruebas
  beforeAll(async () => {
    // Limpiar datos de prueba anteriores
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
    
    // Crear un usuario de prueba
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await prisma.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        name: testUser.name,
        isActive: true
      }
    });
  });
  
  // Limpiar después de todas las pruebas
  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
    
    // Cerrar conexión a la base de datos
    await prisma.$disconnect();
  });
  
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
    it('debería devolver el perfil del usuario autenticado', async () => {
      // Asegurarse de que tenemos un token
      if (!authToken) {
        throw new Error('Auth token no disponible para prueba');
      }
      
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
    
    // Limpiar usuario de prueba después de las pruebas
    afterAll(async () => {
      await prisma.user.deleteMany({
        where: {
          email: newUser.email
        }
      });
    });
    
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
          email: testUser.email, // Email ya existente
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
