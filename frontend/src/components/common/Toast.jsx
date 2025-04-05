import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Toast para mostrar notificaciones temporales
 * Soporta diferentes tipos (success, error, warning, info)
 */
const Toast = ({ toast, onClose }) => {
  const { id, type, message, duration = 5000 } = toast;
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  const getToastClasses = () => {
    const baseClasses = "p-4 rounded-md shadow-md flex items-start justify-between";
    
    const typeClasses = {
      success: "bg-green-100 text-green-800 border-l-4 border-green-500",
      error: "bg-red-100 text-red-800 border-l-4 border-red-500",
      warning: "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500",
      info: "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
    };
    
    return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };
  
  return (
    <div className={getToastClasses()} style={{ minWidth: '280px', maxWidth: '400px' }}>
      <div className="flex items-center">
        <span className="mr-2 text-lg">{getIcon()}</span>
        <p className="text-sm">{message}</p>
      </div>
      <button 
        onClick={() => onClose && onClose(id)} 
        className="ml-3 text-gray-500 hover:text-gray-800"
      >
        ×
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