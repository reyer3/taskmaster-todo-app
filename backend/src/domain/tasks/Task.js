/**
 * Modelo de dominio para una Tarea
 * Implementa comportamiento y validaciones según el principio Tell, Don't Ask
 */
class Task {
  constructor({
    id,
    title,
    description = "",
    completed = false,
    userId,
    dueDate = null,
    priority = "none",
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this._validateTitle(title);
    this._validateUserId(userId);
    
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.userId = userId;
    this.dueDate = dueDate;
    this.priority = this._validatePriority(priority);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  
  // Validaciones
  _validateTitle(title) {
    if (!title || title.trim() === "") {
      throw new Error("Task title cannot be empty");
    }
    
    if (title.length > 100) {
      throw new Error("Task title cannot exceed 100 characters");
    }
  }
  
  _validateUserId(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }
  }
  
  _validatePriority(priority) {
    const validPriorities = ["none", "low", "medium", "high"];
    
    if (!validPriorities.includes(priority)) {
      return "none";
    }
    
    return priority;
  }
  
  // Comportamiento (Tell, Don't Ask)
  markAsCompleted() {
    this.completed = true;
    this.updatedAt = new Date();
    return this;
  }
  
  markAsIncomplete() {
    this.completed = false;
    this.updatedAt = new Date();
    return this;
  }
  
  updateTitle(newTitle) {
    this._validateTitle(newTitle);
    this.title = newTitle;
    this.updatedAt = new Date();
    return this;
  }
  
  updateDescription(newDescription) {
    this.description = newDescription || "";
    this.updatedAt = new Date();
    return this;
  }
  
  updateDueDate(newDueDate) {
    this.dueDate = newDueDate;
    this.updatedAt = new Date();
    return this;
  }
  
  updatePriority(newPriority) {
    this.priority = this._validatePriority(newPriority);
    this.updatedAt = new Date();
    return this;
  }
  
  isOverdue() {
    if (!this.dueDate) return false;
    
    const now = new Date();
    return !this.completed && new Date(this.dueDate) < now;
  }
  
  // Transformador a objeto plano para persistencia
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      userId: this.userId,
      dueDate: this.dueDate,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Task };
