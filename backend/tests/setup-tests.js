  // tests/setup-tests.js
  require('dotenv').config();
  // Jest no permite acceder a variables externas dentro de mocks factory
  // Definimos los datos de prueba directamente dentro del mock
  jest.mock('../src/infrastructure/database/prisma-client', () => {
    // Definir el usuario de prueba dentro del ámbito del mock
    const mockTestUser = {
      id: 'test-user-id',
      email: 'testuser@example.com',
      password: '$2a$10$SomeHashedPassword', // Hash para TestPass123!
      name: 'Test User',
      role: 'user',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Definir una tarea de prueba
    const mockTestTask = {
      id: 'task-123',
      title: 'Test Task',
      description: 'This is a test task',
      userId: mockTestUser.id,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      prisma: {
        user: {
          findUnique: jest.fn(({ where }) => {
            if (where.id === mockTestUser.id) {
              return Promise.resolve(mockTestUser);
            }
            if (where.email === mockTestUser.email) {
              return Promise.resolve(mockTestUser);
            }
            return Promise.resolve(null);
          }),
          findMany: jest.fn(() => Promise.resolve([mockTestUser])),
          create: jest.fn(() => Promise.resolve(mockTestUser)),
          update: jest.fn(() => Promise.resolve(mockTestUser)),
          delete: jest.fn(() => Promise.resolve(mockTestUser)),
          deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
        },
        task: {
          findUnique: jest.fn(({ where }) => {
            if (where.id === mockTestTask.id) {
              return Promise.resolve(mockTestTask);
            }
            return Promise.resolve(null);
          }),
          findMany: jest.fn(() => Promise.resolve([mockTestTask])),
          create: jest.fn(() => Promise.resolve(mockTestTask)),
          update: jest.fn(() => Promise.resolve(mockTestTask)),
          delete: jest.fn(() => Promise.resolve(mockTestTask)),
          deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
        },
        notification: {
          findUnique: jest.fn(),
          findMany: jest.fn(() => Promise.resolve([])),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
        },
        notificationPreference: {
          findUnique: jest.fn(),
          upsert: jest.fn(),
        },
        $transaction: jest.fn(callback => callback())
      }
    };
  });

  // Configura variables de entorno para pruebas
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRY = '1h';