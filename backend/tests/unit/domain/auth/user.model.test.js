/**
 * Pruebas unitarias para el modelo de usuario
 */
const {
  User,
  Email,
  Password,
  ValidationError,
  BusinessRuleViolationError,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserPasswordChangedEvent,
  UserActivatedEvent,
  UserDeactivatedEvent
} = require('../../../../src/domain/auth/user.model');
const bcrypt = require('bcrypt');

// Mock para bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('User Model', () => {
  // Tests para Email Value Object
  describe('Email', () => {
    it('debería crear un objeto Email válido', () => {
      const email = new Email('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });

    it('debería normalizar emails a minúsculas', () => {
      const email = new Email('Test@Example.com');
      expect(email.toString()).toBe('test@example.com');
    });

    it('debería lanzar error con un email inválido', () => {
      expect(() => new Email('invalid-email')).toThrow(ValidationError);
      expect(() => new Email('')).toThrow(ValidationError);
      expect(() => new Email(null)).toThrow(ValidationError);
    });

    it('debería comparar correctamente dos objetos Email', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      const email3 = new Email('other@example.com');
      
      expect(email1.equals(email2)).toBe(true);
      expect(email1.equals(email3)).toBe(false);
    });
  });

  // Tests para Password Value Object
  describe('Password', () => {
    it('debería crear un objeto Password válido', () => {
      const password = new Password('ValidPass1', true);
      expect(password.value).toBe('ValidPass1');
      expect(password.isHashed).toBe(true);
    });

    it('debería validar una contraseña no hasheada', () => {
      expect(() => new Password('Short1')).toThrow(ValidationError); // Muy corta
      expect(() => new Password('nouppercase1')).toThrow(ValidationError); // Sin mayúsculas
      expect(() => new Password('NONUMBER')).toThrow(ValidationError); // Sin número
      expect(() => new Password('')).toThrow(ValidationError); // Vacía
    });

    it('debería crear una contraseña hasheada', async () => {
      const hashedPassword = await Password.createHashed('ValidPass1');
      expect(hashedPassword.isHashed).toBe(true);
      expect(hashedPassword.value).toBe('hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('ValidPass1', 10);
    });

    it('debería verificar una contraseña correctamente', async () => {
      const password = new Password('hashed_value', true);
      
      const isValid = await password.verifyPassword('plain_password');
      
      expect(isValid).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('plain_password', 'hashed_value');
    });
  });

  // Tests para User Entity
  describe('User', () => {
    let validUserData;

    beforeEach(() => {
      validUserData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: new Password('hashed_password', true),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isActive: true
      };
    });

    it('debería crear un objeto User válido', () => {
      const user = new User(validUserData);
      
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.passwordHash).toBe('hashed_password');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('debería convertir strings de fechas a objetos Date', () => {
      const user = new User({
        ...validUserData,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      });
      
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('debería validar el nombre', () => {
      expect(() => new User({
        ...validUserData,
        name: ''
      })).toThrow(ValidationError);
      
      expect(() => new User({
        ...validUserData,
        name: 'A'
      })).toThrow(ValidationError);
    });

    it('debería crear un usuario con factory method', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'ValidPass1'
      });
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.isActive).toBe(true);
      expect(user.events.length).toBe(1);
      expect(user.events[0]).toBeInstanceOf(UserCreatedEvent);
    });

    it('debería actualizar propiedades del usuario', () => {
      const user = new User(validUserData);
      
      user.update({
        name: 'Updated Name',
        email: 'updated@example.com'
      });
      
      expect(user.name).toBe('Updated Name');
      expect(user.email).toBe('updated@example.com');
      expect(user.events.length).toBe(1);
      expect(user.events[0]).toBeInstanceOf(UserUpdatedEvent);
    });

    it('no debería actualizar si no hay cambios', () => {
      const user = new User(validUserData);
      
      user.update({
        name: 'Test User',
        email: 'test@example.com'
      });
      
      expect(user.events.length).toBe(0);
    });

    it('debería cambiar la contraseña correctamente', async () => {
      const user = new User(validUserData);
      
      await user.changePassword('oldPassword', 'NewPass123');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashed_password');
      expect(user.events.length).toBe(1);
      expect(user.events[0]).toBeInstanceOf(UserPasswordChangedEvent);
    });

    it('debería fallar al cambiar la contraseña con contraseña actual incorrecta', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);
      const user = new User(validUserData);
      
      await expect(user.changePassword('wrongPassword', 'NewPass123'))
        .rejects.toThrow(BusinessRuleViolationError);
      
      expect(user.events.length).toBe(0);
    });

    it('debería desactivar un usuario', () => {
      const user = new User(validUserData);
      
      user.deactivate();
      
      expect(user.isActive).toBe(false);
      expect(user.events.length).toBe(1);
      expect(user.events[0]).toBeInstanceOf(UserDeactivatedEvent);
    });

    it('debería fallar al desactivar un usuario ya desactivado', () => {
      const user = new User({
        ...validUserData,
        isActive: false
      });
      
      expect(() => user.deactivate()).toThrow(BusinessRuleViolationError);
    });

    it('debería activar un usuario desactivado', () => {
      const user = new User({
        ...validUserData,
        isActive: false
      });
      
      user.activate();
      
      expect(user.isActive).toBe(true);
      expect(user.events.length).toBe(1);
      expect(user.events[0]).toBeInstanceOf(UserActivatedEvent);
    });

    it('debería fallar al activar un usuario ya activado', () => {
      const user = new User(validUserData);
      
      expect(() => user.activate()).toThrow(BusinessRuleViolationError);
    });

    it('debería verificar si un usuario puede iniciar sesión', () => {
      const activeUser = new User(validUserData);
      const inactiveUser = new User({...validUserData, isActive: false});
      
      expect(activeUser.canLogin()).toBe(true);
      expect(inactiveUser.canLogin()).toBe(false);
    });

    it('debería verificar la contraseña correctamente', async () => {
      const user = new User(validUserData);
      
      const isValid = await user.verifyPassword('password123');
      
      expect(isValid).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('debería reconstitutir un usuario desde datos persistidos', () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isActive: true
      };
      
      const user = User.reconstitute(userData);
      
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.passwordHash).toBe('hashed_password');
      expect(user.isActive).toBe(true);
    });

    it('debería convertir a formato persistible', () => {
      const user = new User(validUserData);
      const persistenceData = user.toPersistence();
      
      expect(persistenceData).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isActive: true
      });
    });

    it('debería convertir a DTO sin datos sensibles', () => {
      const user = new User(validUserData);
      const dto = user.toDTO();
      
      expect(dto).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      
      expect(dto).not.toHaveProperty('passwordHash');
    });

    it('debería limpiar eventos', () => {
      const user = new User(validUserData);
      user.update({ name: 'New Name' });
      
      expect(user.events.length).toBe(1);
      
      user.clearEvents();
      
      expect(user.events.length).toBe(0);
    });
  });
});
