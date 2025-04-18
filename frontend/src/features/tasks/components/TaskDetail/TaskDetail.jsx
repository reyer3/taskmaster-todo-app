import React from 'react';
import PropTypes from 'prop-types';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, Edit, Trash2, Calendar, CheckCircle, Circle, Tag } from 'lucide-react';

// Mapeo de prioridades para mostrar en español
const PRIORITY_MAP = {
  'high': 'Alta',
  'medium': 'Media',
  'low': 'Baja',
  'none': 'Sin prioridad'
};

/**
 * Componente para mostrar los detalles de una tarea específica
 */
const TaskDetail = ({
  task,
  onEdit,
  onDelete,
  onBack,
  onToggleComplete,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-sm flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-sm text-center min-h-[300px] flex flex-col justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-500 dark:text-dark-text-secondary">
          Tarea no encontrada o selecciona una tarea para ver sus detalles.
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors mx-auto"
        >
          Volver a la lista
        </button>
      </div>
    );
  }
  
  const { id, title, description, category, priority, completed, createdAt, updatedAt, dueDate, tags = [] } = task;
  
  // Formatear fechas
  const formattedCreatedAt = createdAt 
    ? format(new Date(createdAt), 'dd MMM yyyy, HH:mm', { locale: es })
    : 'Fecha desconocida';
    
  const formattedUpdatedAt = updatedAt 
    ? format(new Date(updatedAt), 'dd MMM yyyy, HH:mm', { locale: es })
    : 'Sin actualizar';
    
  const formattedDueDate = dueDate 
    ? format(new Date(dueDate), 'dd MMM yyyy', { locale: es })
    : 'Sin fecha límite';
    
  const timeToDeadline = dueDate 
    ? formatDistanceToNow(new Date(dueDate), { addSuffix: true, locale: es })
    : null;
    
  // Verificar si la tarea está vencida (solo si no está completada)
  const isOverdue = dueDate && !completed && isAfter(new Date(), new Date(dueDate));
  
  // Determinar clases de prioridad
  const priorityClasses = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    none: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };
  
  // Determinar clases de categoría
  const categoryClasses = {
    trabajo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    personal: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    estudio: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    default: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };
  
  return (
    <div className="bg-white dark:bg-dark-bg-secondary p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-gray-500 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          Volver
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(id)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <Edit size={16} className="mr-1" />
            Editar
          </button>
          
          <button
            onClick={() => onDelete(id)}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-800 rounded-md text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={16} className="mr-1" />
            Eliminar
          </button>
        </div>
      </div>
      
      {/* Título y estado */}
      <div className="flex items-start justify-between mb-4">
        <h1 className={`text-2xl font-bold ${completed ? 'text-gray-500 dark:text-dark-text-secondary line-through' : 'text-gray-900 dark:text-dark-text-primary'}`}>
          {title}
        </h1>
        
        <button
          onClick={() => onToggleComplete(id, !completed)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            completed 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50' 
              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900/50'
          }`}
          aria-label={`Marcar tarea como ${completed ? 'pendiente' : 'completada'}`}
        >
          {completed ? (
            <>
              <CheckCircle size={16} className="mr-1.5" />
              Completada
            </>
          ) : (
            <>
              <Circle size={16} className="mr-1.5" />
              Pendiente
            </>
          )}
        </button>
      </div>
      
      {/* Metadatos */}
      <div className="flex flex-wrap gap-2 mb-6">
        {priority && priority !== 'none' && (
          <span className={`text-xs px-2 py-1 rounded-full ${priorityClasses[priority] || priorityClasses.none}`}>
            Prioridad: {PRIORITY_MAP[priority] || priority}
          </span>
        )}
        
        {category && (
          <span className={`text-xs px-2 py-1 rounded-full ${categoryClasses[category] || categoryClasses.default}`}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        )}
        
        {dueDate && (
          <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
            isOverdue 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}>
            <Calendar size={12} className="mr-1" />
            {formattedDueDate}
            {timeToDeadline && <span className="ml-1">({timeToDeadline})</span>}
          </span>
        )}
      </div>
      
      {/* Descripción */}
      {description && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary mb-2">
            Descripción
          </h2>
          <p className="text-gray-700 dark:text-dark-text-secondary whitespace-pre-line">
            {description}
          </p>
        </div>
      )}
      
      {/* Etiquetas */}
      {tags.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2 flex items-center">
            <Tag size={14} className="mr-1" />
            Etiquetas
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span 
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Fechas */}
      <div className="text-xs text-gray-500 dark:text-dark-text-secondary border-t border-gray-200 dark:border-dark-border pt-4">
        <div className="flex justify-between">
          <span>Creada: {formattedCreatedAt}</span>
          <span>Actualizada: {formattedUpdatedAt}</span>
        </div>
      </div>
    </div>
  );
};

TaskDetail.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    priority: PropTypes.string,
    completed: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    dueDate: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default TaskDetail; 