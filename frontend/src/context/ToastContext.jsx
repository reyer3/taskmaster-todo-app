import { createContext, useState, useCallback } from 'react';

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
  const showSuccessToast = useCallback((message, duration) => {
    return showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showErrorToast = useCallback((message, duration) => {
    return showToast({ message, type: 'error', duration });
  }, [showToast]);

  const showInfoToast = useCallback((message, duration) => {
    return showToast({ message, type: 'info', duration });
  }, [showToast]);

  const showWarningToast = useCallback((message, duration) => {
    return showToast({ message, type: 'warning', duration });
  }, [showToast]);

  // Valores proporcionados por el contexto
  const value = {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};
