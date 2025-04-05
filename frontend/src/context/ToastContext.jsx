import { createContext, useState, useCallback, useContext } from 'react';

// Creación del contexto
export const ToastContext = createContext();

/**
 * Proveedor del contexto de notificaciones toast
 * Maneja la creación, eliminación y estado de las notificaciones
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Crea una nueva notificación toast
   * @param {Object} toast - Configuración de la notificación
   * @param {string} toast.message - Mensaje a mostrar
   * @param {string} toast.type - Tipo de notificación ('success', 'error', 'info', 'warning')
   * @param {number} toast.duration - Duración en ms (por defecto 5000ms)
   */
  const showToast = useCallback((toast) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.duration || 5000
    };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
    
    return id;
  }, []);

  /**
   * Elimina una notificación toast por su ID
   * @param {string} id - ID de la notificación a eliminar
   */
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  /**
   * Elimina todas las notificaciones
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos específicos por tipo
  const success = useCallback((message, duration) => {
    return showToast({ message, type: 'success', duration });
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast({ message, type: 'error', duration });
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast({ message, type: 'info', duration });
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast({ message, type: 'warning', duration });
  }, [showToast]);

  // Valores proporcionados por el contexto
  const value = {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

/**
 * Hook para utilizar el contexto de notificaciones toast
 * @returns {Object} Funciones y estado de las notificaciones toast
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};
