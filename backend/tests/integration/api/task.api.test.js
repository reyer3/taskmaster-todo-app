/**
 * Pruebas de integración para endpoints de tareas
 */
const request = require('supertest');
const app = require('../../../src/app');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Cliente Prisma para pruebas
const prisma = new PrismaClient();

describe('Task API Endpoints', () => {
  // Usuario de prueba
  const testUser = {
    id: 'test-user-id',
    email: 'test-task-api@example.com',
    name: 'Test User'
  };
  
  // Token para autenticación
  let authToken;
  
  // ID de tarea creada durante pruebas
  let createdTaskId;
  
  // Datos para crear tarea
  const taskData = {
    title: 'Tarea de prueba de integración',
    description: 'Descripción para prueba de API',
    priority: 'medium',
    category: 'trabajo',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días en el futuro
  };
  
  // Preparar antes de todas las pruebas
  beforeAll(async () => {
    // Crear usuario de prueba si no existe
    try {
      await prisma.user.upsert({
        where: { id: testUser.id },
        update: {},
        create: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          passwordHash: 'test-hash',
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error al crear usuario de prueba:', error);
    }
    
    // Generar token JWT para pruebas
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '1h' }
    );
  });
  
  // Limpiar después de todas las pruebas
  afterAll(async () => {
    // Eliminar tareas creadas durante pruebas
    await prisma.task.deleteMany({
      where: {
        userId: testUser.id
      }
    });
    
    // Cerrar conexión a la base de datos
    await prisma.$disconnect();
  });
  
  describe('GET /api/tasks', () => {
    it('debería devolver la lista de tareas del usuario', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('debería rechazar peticiones sin autenticación', async () => {
      const response = await request(app)
        .get('/api/tasks');
      
      // Verificaciones
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/tasks', () => {
    it('debería crear una nueva tarea', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);
      
      // Verificaciones
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', taskData.title);
      expect(response.body).toHaveProperty('description', taskData.description);
      expect(response.body).toHaveProperty('userId', testUser.id);
      
      // Guardar ID para pruebas posteriores
      createdTaskId = response.body.id;
    });
    
    it('debería rechazar tareas sin título', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...taskData,
          title: '' // Título vacío
        });
      
      // Verificaciones
      expect(response.status).toBe(400);
    });
  });
  
  describe('GET /api/tasks/upcoming', () => {
    it('debería devolver tareas próximas a vencer', async () => {
      const response = await request(app)
        .get('/api/tasks/upcoming')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('debería aceptar parámetro days', async () => {
      const response = await request(app)
        .get('/api/tasks/upcoming?days=14')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('PUT /api/tasks/:id', () => {
    it('debería actualizar una tarea existente', async () => {
      // Asegurarse de que tenemos un ID
      if (!createdTaskId) {
        throw new Error('No se creó tarea para pruebas');
      }
      
      const updates = {
        title: 'Título actualizado',
        description: 'Descripción actualizada',
        priority: 'high'
      };
      
      const response = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdTaskId);
      expect(response.body).toHaveProperty('title', updates.title);
      expect(response.body).toHaveProperty('description', updates.description);
      expect(response.body).toHaveProperty('priority', updates.priority);
    });
    
    it('debería rechazar actualización de tareas que no existen', async () => {
      const response = await request(app)
        .put('/api/tasks/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Nueva tarea' });
      
      // Verificaciones
      expect(response.status).toBe(404);
    });
    
    it('debería rechazar actualización de tareas de otro usuario', async () => {
      // Crear JWT con otro usuario
      const otherUserToken = jwt.sign(
        { id: 'other-user-id', email: 'other@example.com' },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Intento de modificación' });
      
      // Verificaciones
      expect(response.status).toBe(403);
    });
  });
  
  describe('PATCH /api/tasks/:id/complete', () => {
    it('debería marcar una tarea como completada', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${createdTaskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: true });
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdTaskId);
      expect(response.body).toHaveProperty('completed', true);
    });
    
    it('debería marcar una tarea como pendiente', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${createdTaskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completed: false });
      
      // Verificaciones
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdTaskId);
      expect(response.body).toHaveProperty('completed', false);
    });
    
    it('debería requerir el campo completed', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${createdTaskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      // Verificaciones
      expect(response.status).toBe(400);
    });
  });
  
  describe('DELETE /api/tasks/:id', () => {
    it('debería eliminar una tarea', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Verificaciones
      expect(response.status).toBe(204);
      
      // Verificar que la tarea ya no existe
      const checkResponse = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(checkResponse.status).toBe(404);
    });
    
    it('debería manejar intentos de eliminar tareas que no existen', async () => {
      const response = await request(app)
        .delete('/api/tasks/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Verificaciones
      expect(response.status).toBe(404);
    });
  });
});
