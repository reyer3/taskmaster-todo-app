import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

/**
 * Componente Modal reutilizable que muestra contenido en una ventana modal
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef(null);
  
  // Determinar clases de tamaño
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  // Manejar cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    // Prevenir scroll en el body cuando el modal está abierto
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Limpiar efectos
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restaurar scroll
      if (isOpen) {
        document.body.style.overflow = originalStyle;
      }
    };
  }, [isOpen, onClose]);
  
  // Cerrar cuando se hace clic fuera del modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  // No renderizar nada si el modal está cerrado
  if (!isOpen) return null;
  
  // Crear portal para renderizar el modal fuera de la jerarquía de componentes
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity animate-fadeIn"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl w-full ${sizeClasses[size] || sizeClasses.md} transform transition-all animate-slideIn`}
        role="document"
      >
        {/* Encabezado del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary">
            {title}
          </h3>
          <button
            type="button"
            className="text-gray-400 dark:text-dark-text-secondary hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Contenido del modal */}
        <div className="overflow-y-auto max-h-[calc(100vh-14rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
};

export default Modal; 