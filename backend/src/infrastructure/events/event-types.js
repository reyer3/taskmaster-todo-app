/**
 * Tipos de eventos del sistema
 * 
 * Este archivo centraliza los tipos de eventos disponibles en la aplicación
 * para evitar errores por cadenas de texto mal escritas.
 */

// Eventos de usuario
const UserEvents = {
  REGISTERED: 'user.registered',
  UPDATED: 'user.updated',
  PASSWORD_CHANGED: 'user.password_changed',
  LOGIN_SUCCESS: 'user.login_success',
  LOGIN_FAILED: 'user.login_failed',
};

// Eventos de tareas
const TaskEvents = {
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  COMPLETED: 'task.completed',
  DELETED: 'task.deleted',
  DUE_SOON: 'task.due_soon',
};

// Eventos del sistema
const SystemEvents = {
  ERROR: 'system.error',
  STARTUP: 'system.startup',
  SHUTDOWN: 'system.shutdown',
  HEALTH_CHECK: 'system.health_check',
};

module.exports = {
  UserEvents,
  TaskEvents,
  SystemEvents,
};
