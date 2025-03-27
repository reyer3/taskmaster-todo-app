/**
 * Servicio para gestión de tokens JWT en localStorage
 * 
 * Este módulo proporciona funciones para guardar, obtener y eliminar
 * tokens JWT del localStorage, así como para verificar su validez.
 */

const TOKEN_KEY = 'auth_token';

/**
 * Guarda el token en localStorage
 * @param {string} token - El token JWT a guardar
 */
export const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Obtiene el token de localStorage
 * @returns {string|null} El token JWT o null si no existe
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Elimina el token de localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Verifica si hay un token guardado
 * @returns {boolean} true si hay un token guardado
 */
export const hasToken = () => {
  return !!getToken();
};

/**
 * Extrae la información del token JWT
 * @param {string} token - Token JWT a decodificar
 * @returns {Object|null} Payload decodificado o null si es inválido
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    // Token JWT consiste de header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
};

/**
 * Verifica si el token ha expirado
 * @param {string} token - Token JWT a verificar
 * @returns {boolean} true si el token ha expirado
 */
export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000; // convertir a milisegundos
  return Date.now() >= expirationTime;
};

/**
 * Verifica si el token actual es válido
 * @returns {boolean} true si el token es válido y no ha expirado
 */
export const isValidToken = () => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};
