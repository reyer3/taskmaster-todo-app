import { useState, useCallback, useContext, createContext } from 'react';

/**
 * Contexto para el sistema de notificaciones toast
 */
const ToastContext = createContext(null);

/**
 * ID único para cada toast
 */
let toastIdCounter = 1;

/**
 * Provider para las notificaciones toast
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Añadir una nueva notificación toast
  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = toastIdCounter++;
    
    setToasts(prev => [
      ...prev,
      { id, message, type, duration }
    ]);
    
    return id;
  }, []);
  
  // Eliminar una notificación por ID
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // Métodos de conveniencia para diferentes tipos de notificaciones
  const success = useCallback((message, duration) => 
    addToast(message, 'success', duration), [addToast]);
  
  const error = useCallback((message, duration) => 
    addToast(message, 'error', duration), [addToast]);
  
  const warning = useCallback((message, duration) => 
    addToast(message, 'warning', duration), [addToast]);
  
  const info = useCallback((message, duration) => 
    addToast(message, 'info', duration), [addToast]);
  
  // Eliminar todas las notificaciones
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Valor del contexto
  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearToasts
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook para usar el sistema de notificaciones toast
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  
  return context;
};

export default useToast; 