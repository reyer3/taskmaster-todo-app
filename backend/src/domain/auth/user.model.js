/**
 * Modelo de dominio para Usuario con principios avanzados de DDD
 *
 * Esta implementación encapsula lógica de negocio, validaciones,
 * invariantes de dominio y eventos de dominio para el concepto de Usuario.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt'); // Asegúrate de tener esta dependencia instalada

// Errores de dominio
class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends DomainError {
  constructor(message) {
    super(message);
  }
}

class BusinessRuleViolationError extends DomainError {
  constructor(message) {
    super(message);
  }
}

// Value Objects
class Email {
  constructor(address) {
    if (!address || !this.isValid(address)) {
      throw new ValidationError('Email inválido');
    }
    this.address = address.toLowerCase(); // Normalizar emails a minúsculas
  }

  isValid(email) {
    // Validación más robusta que la original
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  toString() {
    return this.address;
  }

  equals(other) {
    return other instanceof Email && other.address === this.address;
  }
}

class Password {
  constructor(value, isHashed = false) {
    if (!value) {
      throw new ValidationError('La contraseña no puede estar vacía');
    }

    if (!isHashed) {
      this.validate(value);
    }

    this._value = value;
    this._isHashed = isHashed;
  }

  validate(password) {
    if (password.length < 8) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
    }

    // Agregar validaciones adicionales si es necesario
    // Por ejemplo: al menos un número, una mayúscula, etc.
    if (!/\d/.test(password)) {
      throw new ValidationError('La contraseña debe contener al menos un número');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('La contraseña debe contener al menos una letra mayúscula');
    }
  }

  get value() {
    return this._value;
  }

  get isHashed() {
    return this._isHashed;
  }

  async verifyPassword(plainPassword) {
    if (!this._isHashed) {
      return this._value === plainPassword;
    }
    return bcrypt.compare(plainPassword, this._value);
  }

  static async createHashed(plainPassword) {
    // Primero validamos que cumpla los requisitos
    const tempPassword = new Password(plainPassword, false);
    // Luego hasheamos
    const hash = await bcrypt.hash(plainPassword, 10);
    return new Password(hash, true);
  }
}

// Eventos de dominio
class DomainEvent {
  constructor(aggregateId, eventData = {}, timestamp = new Date()) {
    this.aggregateId = aggregateId;
    this.eventType = this.constructor.name;
    this.timestamp = timestamp;
    this.data = eventData;
  }
}

class UserCreatedEvent extends DomainEvent {
  constructor(user) {
    super(user.id, { email: user.email, name: user.name }, new Date());
  }
}

class UserUpdatedEvent extends DomainEvent {
  constructor(user, changes = {}) {
    super(user.id, { changes }, new Date());
  }
}

class UserPasswordChangedEvent extends DomainEvent {
  constructor(user) {
    super(user.id, {}, new Date());
  }
}

class UserActivatedEvent extends DomainEvent {
  constructor(user) {
    super(user.id, {}, new Date());
  }
}

class UserDeactivatedEvent extends DomainEvent {
  constructor(user) {
    super(user.id, {}, new Date());
  }
}

// Entidad principal User (Aggregate Root)
class User {
  constructor({
                id = uuidv4(),
                email,
                name,
                password,
                createdAt = new Date(),
                updatedAt = new Date(),
                isActive = true
              }) {
    this._id = id;
    this._email = email instanceof Email ? email : new Email(email);
    this._name = this._validateName(name);
    this._password = password instanceof Password ? password : new Password(password, true);
    this._createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this._updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
    this._isActive = isActive;
    this._events = [];
  }

  // Validaciones
  _validateName(name) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new ValidationError('Nombre inválido (mínimo 2 caracteres)');
    }
    return name.trim();
  }

  // Getters
  get id() { return this._id; }
  get email() { return this._email.toString(); }
  get name() { return this._name; }
  get createdAt() { return new Date(this._createdAt); } // Devolver copia para inmutabilidad
  get updatedAt() { return new Date(this._updatedAt); } // Devolver copia para inmutabilidad
  get isActive() { return this._isActive; }
  get events() { return [...this._events]; }
  get passwordHash() { return this._password.value; }

  // Métodos de dominio
  update(updates) {
    const changedFields = {};

    if (updates.name && updates.name !== this._name) {
      this._name = this._validateName(updates.name);
      changedFields.name = true;
    }

    if (updates.email && updates.email !== this.email) {
      const newEmail = updates.email instanceof Email
          ? updates.email
          : new Email(updates.email);

      // Verificar que el email realmente cambió
      if (!this._email.equals(newEmail)) {
        this._email = newEmail;
        changedFields.email = true;
      }
    }

    // Solo si hubo cambios, actualizamos
    if (Object.keys(changedFields).length > 0) {
      this._updatedAt = new Date();
      this._events.push(new UserUpdatedEvent(this, changedFields));
    }

    return this;
  }

  async changePassword(currentPassword, newPassword) {
    // Verificar contraseña actual
    const isValid = await this._password.verifyPassword(currentPassword);
    if (!isValid) {
      throw new BusinessRuleViolationError('Contraseña actual incorrecta');
    }

    // Crear nueva contraseña hasheada
    this._password = await Password.createHashed(newPassword);
    this._updatedAt = new Date();
    this._events.push(new UserPasswordChangedEvent(this));
    return this;
  }

  async setPasswordHash(newPasswordHash) {
    this._password = new Password(newPasswordHash, true);
    this._updatedAt = new Date();
    this._events.push(new UserPasswordChangedEvent(this));
    return this;
  }

  deactivate() {
    if (!this._isActive) {
      throw new BusinessRuleViolationError('La cuenta ya está desactivada');
    }

    this._isActive = false;
    this._updatedAt = new Date();
    this._events.push(new UserDeactivatedEvent(this));
    return this;
  }

  activate() {
    if (this._isActive) {
      throw new BusinessRuleViolationError('La cuenta ya está activada');
    }

    this._isActive = true;
    this._updatedAt = new Date();
    this._events.push(new UserActivatedEvent(this));
    return this;
  }

  canLogin() {
    return this._isActive;
  }

  /**
   * Verifica si una contraseña coincide con la del usuario
   * @param {string} plainPassword - Contraseña en texto plano a verificar
   * @returns {Promise<boolean>} true si la contraseña es válida
   */
  async verifyPassword(plainPassword) {
    return this._password.verifyPassword(plainPassword);
  }

  clearEvents() {
    this._events = [];
  }

  // Factory methods
  static async create({ name, email, password: plainPassword }) {
    const hashedPassword = await Password.createHashed(plainPassword);

    const user = new User({
      email: email instanceof Email ? email : new Email(email),
      name,
      password: hashedPassword
    });

    user._events.push(new UserCreatedEvent(user));
    return user;
  }

  static reconstitute(data) {
    return new User({
      id: data.id,
      email: data.email,
      name: data.name,
      password: new Password(data.passwordHash, true),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      isActive: data.isActive
    });
  }

  /**
   * Devuelve un objeto plano con los datos persistibles del usuario
   * para ser usado por el repositorio.
   * @returns {object} Datos para persistencia.
   */
  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      passwordHash: this.passwordHash,
      isActive: this.isActive,
      // Solo incluir si no son manejados automáticamente por la ORM/base de datos
      // createdAt: this.createdAt,
      // updatedAt: this.updatedAt,
    };
  }

  /**
   * Devuelve un objeto plano con datos seguros del usuario para el cliente,
   * omitiendo información sensible como el hash de la contraseña.
   * @returns {object} Datos seguros para API/Cliente.
   */
  toDTO() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  // Errores
  DomainError,
  ValidationError,
  BusinessRuleViolationError,

  // Value Objects
  Email,
  Password,

  // Eventos
  UserCreatedEvent,
  UserUpdatedEvent,
  UserPasswordChangedEvent,
  UserActivatedEvent,
  UserDeactivatedEvent,

  // Entidad principal
  User
};