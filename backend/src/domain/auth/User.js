/**
 * Modelo de dominio para Usuario
 * Implementa comportamiento y validaciones según el principio Tell, Don't Ask
 */
class User {
  constructor({
    id,
    email,
    passwordHash,
    name,
    role = "user",
    isActive = true,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this._validateEmail(email);
    this._validateName(name);
    this._validatePasswordHash(passwordHash);
    
    this.id = id;
    this.email = email.toLowerCase();
    this.passwordHash = passwordHash;
    this.name = name;
    this.role = this._validateRole(role);
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  
  // Validaciones
  _validateEmail(email) {
    if (!email || email.trim() === "") {
      throw new Error("Email cannot be empty");
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
  }
  
  _validateName(name) {
    if (!name || name.trim() === "") {
      throw new Error("Name cannot be empty");
    }
    
    if (name.length > 100) {
      throw new Error("Name cannot exceed 100 characters");
    }
  }
  
  _validatePasswordHash(passwordHash) {
    if (!passwordHash) {
      throw new Error("Password hash is required");
    }
  }
  
  _validateRole(role) {
    const validRoles = ["admin", "user"];
    
    if (!validRoles.includes(role)) {
      return "user";
    }
    
    return role;
  }
  
  // Comportamiento (Tell, Don't Ask)
  updateName(newName) {
    this._validateName(newName);
    this.name = newName;
    this.updatedAt = new Date();
    return this;
  }
  
  updateEmail(newEmail) {
    this._validateEmail(newEmail);
    this.email = newEmail.toLowerCase();
    this.updatedAt = new Date();
    return this;
  }
  
  updatePasswordHash(newPasswordHash) {
    this._validatePasswordHash(newPasswordHash);
    this.passwordHash = newPasswordHash;
    this.updatedAt = new Date();
    return this;
  }
  
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
    return this;
  }
  
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
    return this;
  }
  
  makeAdmin() {
    this.role = "admin";
    this.updatedAt = new Date();
    return this;
  }
  
  revokeAdmin() {
    this.role = "user";
    this.updatedAt = new Date();
    return this;
  }
  
  isAdmin() {
    return this.role === "admin";
  }
  
  // Transformador a objeto plano para persistencia
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  // No incluye el password hash por seguridad
  toSafeJSON() {
    const json = this.toJSON();
    delete json.passwordHash;
    return json;
  }
}

module.exports = { User };
