import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Toast para mostrar notificaciones temporales
 * Soporta diferentes tipos (success, error, warning, info)
 */
const Toast = ({ toast, onClose }) => {
  const { id, type, message, duration = 5000 } = toast;
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    // Animar entrada
    setTimeout(() => setIsVisible(true), 10);
    
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration]);
  
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose(id);
    }, 300); // Duración de la animación de salida
  };
  
  const getToastClasses = () => {
    const baseClasses = "p-4 rounded-lg shadow-lg flex items-start gap-2 transition-all duration-300 ease-in-out";
    const visibilityClasses = isVisible 
      ? (isExiting ? "opacity-0 transform translate-x-5" : "opacity-100") 
      : "opacity-0 transform translate-x-5";
    
    const typeClasses = {
      success: "bg-white border-l-4 border-green-500 text-gray-700",
      error: "bg-white border-l-4 border-red-500 text-gray-700",
      warning: "bg-white border-l-4 border-yellow-500 text-gray-700",
      info: "bg-white border-l-4 border-blue-500 text-gray-700"
    };
    
    return `${baseClasses} ${typeClasses[type] || typeClasses.info} ${visibilityClasses}`;
  };
  
  const getIconClasses = () => {
    const baseClasses = "flex-shrink-0 w-5 h-5 mr-1";
    
    const typeClasses = {
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500"
    };
    
    return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className={getIconClasses()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={getIconClasses()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={getIconClasses()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={getIconClasses()} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <div className={getToastClasses()} style={{ minWidth: '300px', maxWidth: '400px' }}>
      {getIcon()}
      <p className="text-sm flex-grow">{message}</p>
      <button 
        onClick={handleClose} 
        className="flex-shrink-0 w-5 h-5 text-gray-400 hover:text-gray-700 focus:outline-none"
        aria-label="Cerrar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    message: PropTypes.string.isRequired,
    duration: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func
};

export default Toast; 