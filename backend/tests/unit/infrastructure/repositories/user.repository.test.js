/**
 * Pruebas unitarias para el repositorio de usuario
 */

// Definimos los mocks antes de importar los módulos
const mockPrismaUser = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  $transaction: jest.fn(callback => callback())
};

// Usamos doMock en lugar de mock para evitar el hoisting
jest.doMock('../../../../src/infrastructure/database/prisma-client', () => ({
  prisma: {
    user: mockPrismaUser,
    $transaction: mockPrismaUser.$transaction
  }
}), {virtual: true});

// Ahora importamos los módulos (después de configurar los mocks)
const { UserRepository } = require('../../../../src/infrastructure/repositories/user.repository');
const { User, ValidationError } = require('../../../../src/domain/auth/user.model');

// Mock del eventPublisher
const mockEventPublisher = {
  publish: jest.fn()
};

describe('UserRepository', () => {
  let userRepository;
  let mockUserData;
  let mockUser;

  beforeEach(() => {
    // Reset todos los mocks
    jest.clearAllMocks();
    
    // Crear una instancia del repositorio
    userRepository = new UserRepository(mockEventPublisher);
    
    // Datos de usuario de prueba
    mockUserData = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };
    
    // Mock para el usuario
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
      isActive: true,
      events: [],
      toPersistence: jest.fn().mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        isActive: true
      }),
      clearEvents: jest.fn(),
      deactivate: jest.fn()
    };
    
    // Mock para el método reconstitute
    User.reconstitute = jest.fn().mockReturnValue(mockUser);
  });

  describe('findById', () => {
    it('debería encontrar un usuario por ID', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.findUnique.mockResolvedValue(mockUserData);

      // Ejecutar método
      const result = await userRepository.findById('user-123');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
      expect(User.reconstitute).toHaveBeenCalledWith(mockUserData);
      expect(result).toEqual(mockUser);
    });

    it('debería retornar null si el usuario no existe', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Ejecutar método
      const result = await userRepository.findById('nonexistent');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
      expect(result).toBeNull();
    });

    it('debería lanzar error si el ID es vacío', async () => {
      await expect(userRepository.findById(null))
        .rejects.toThrow(ValidationError);
      await expect(userRepository.findById(undefined))
        .rejects.toThrow(ValidationError);
      
      expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('debería encontrar un usuario por email', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.findUnique.mockResolvedValue(mockUserData);

      // Ejecutar método
      const result = await userRepository.findByEmail('test@example.com');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(User.reconstitute).toHaveBeenCalledWith(mockUserData);
      expect(result).toEqual(mockUser);
    });

    it('debería normalizar el email a minúsculas', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.findUnique.mockResolvedValue(mockUserData);

      // Ejecutar método
      await userRepository.findByEmail('TEST@example.com');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('debería retornar null si el usuario no existe', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Ejecutar método
      const result = await userRepository.findByEmail('nonexistent@example.com');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      });
      expect(result).toBeNull();
    });

    it('debería lanzar error si el email es vacío', async () => {
      await expect(userRepository.findByEmail(null))
        .rejects.toThrow(ValidationError);
      await expect(userRepository.findByEmail(''))
        .rejects.toThrow(ValidationError);
      
      expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('debería crear un usuario nuevo', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.create.mockResolvedValue(mockUserData);
      
      // Añadir eventos al mock del usuario
      mockUser.events = ['event1', 'event2'];

      // Ejecutar método
      const result = await userRepository.create(mockUser);

      // Verificaciones
      expect(mockPrismaUser.create).toHaveBeenCalledWith({
        data: mockUser.toPersistence()
      });
      expect(mockUser.toPersistence).toHaveBeenCalled();
      expect(User.reconstitute).toHaveBeenCalledWith(mockUserData);
      expect(mockUser.clearEvents).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('debería actualizar un usuario existente', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.update.mockResolvedValue(mockUserData);
      
      // Añadir eventos al mock del usuario
      mockUser.events = ['event1'];

      // Ejecutar método
      const result = await userRepository.update(mockUser);

      // Verificaciones
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: mockUser.toPersistence()
      });
      expect(mockUser.toPersistence).toHaveBeenCalled();
      expect(User.reconstitute).toHaveBeenCalledWith(mockUserData);
      expect(mockUser.clearEvents).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('existsByEmail', () => {
    it('debería retornar true si el email existe', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.count.mockResolvedValue(1);

      // Ejecutar método
      const result = await userRepository.existsByEmail('test@example.com');

      // Verificaciones
      expect(mockPrismaUser.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(result).toBe(true);
    });

    it('debería retornar false si el email no existe', async () => {
      // Mock de respuesta de Prisma
      mockPrismaUser.count.mockResolvedValue(0);

      // Ejecutar método
      const result = await userRepository.existsByEmail('nonexistent@example.com');

      // Verificaciones
      expect(mockPrismaUser.count).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      });
      expect(result).toBe(false);
    });

    it('debería lanzar error si el email es vacío', async () => {
      await expect(userRepository.existsByEmail(null))
        .rejects.toThrow(ValidationError);
      
      expect(mockPrismaUser.count).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('debería desactivar un usuario existente', async () => {
      // Mock para encontrar el usuario
      mockPrismaUser.findUnique.mockResolvedValue(mockUserData);
      // Mock para el update
      mockPrismaUser.update.mockResolvedValue({...mockUserData, isActive: false});

      // Ejecutar método
      const result = await userRepository.softDelete('user-123');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
      expect(mockUser.deactivate).toHaveBeenCalled();
      expect(mockPrismaUser.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('debería retornar false si el usuario no existe', async () => {
      // Mock para encontrar el usuario
      mockPrismaUser.findUnique.mockResolvedValue(null);

      // Ejecutar método
      const result = await userRepository.softDelete('nonexistent');

      // Verificaciones
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
      expect(mockUser.deactivate).not.toHaveBeenCalled();
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('withTransaction', () => {
    it('debería ejecutar operaciones en una transacción', async () => {
      // Callback para la transacción
      const transactionCallback = jest.fn().mockResolvedValue('transaction-result');

      // Ejecutar método
      const result = await userRepository.withTransaction(transactionCallback);

      // Verificaciones
      expect(mockPrismaUser.$transaction).toHaveBeenCalled();
      expect(transactionCallback).toHaveBeenCalled();
      expect(result).toBe('transaction-result');
    });
  });

  describe('findByCriteria', () => {
    it('debería buscar usuarios con criterios', async () => {
      // Mock de respuesta de Prisma para findMany y count
      mockPrismaUser.findMany.mockResolvedValue([mockUserData]);
      mockPrismaUser.count.mockResolvedValue(1);

      // Criterios de búsqueda
      const criteria = {
        name: 'Test',
        email: 'test',
        isActive: true
      };

      // Opciones de paginación
      const options = {
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' }
      };

      // Ejecutar método
      const result = await userRepository.findByCriteria(criteria, options);

      // Verificaciones
      expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Test' },
          email: { contains: 'test' },
          isActive: true
        },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' }
      });
      
      expect(mockPrismaUser.count).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Test' },
          email: { contains: 'test' },
          isActive: true
        }
      });
      
      expect(result).toEqual({
        users: [mockUser],
        total: 1
      });
    });

    it('debería usar valores predeterminados si no se proporcionan criterios u opciones', async () => {
      // Mock de respuesta de Prisma para findMany y count
      mockPrismaUser.findMany.mockResolvedValue([mockUserData]);
      mockPrismaUser.count.mockResolvedValue(1);

      // Ejecutar método
      const result = await userRepository.findByCriteria();

      // Verificaciones
      expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      expect(mockPrismaUser.count).toHaveBeenCalledWith({
        where: {}
      });
      
      expect(result).toEqual({
        users: [mockUser],
        total: 1
      });
    });
  });
});
