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

// Eventos de autenticación
const AuthEvents = {
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILED: 'auth.login_failed',
  PASSWORD_CHANGED: 'auth.password_changed',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  NEW_LOGIN: 'auth.new_login',
  SUSPICIOUS_LOGIN_ATTEMPT: 'auth.suspicious_login_attempt',
};

module.exports = {
  UserEvents,
  TaskEvents,
  SystemEvents,
  AuthEvents,

};
