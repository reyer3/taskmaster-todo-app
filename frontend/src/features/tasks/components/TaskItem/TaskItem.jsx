import React from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente que muestra un elemento de tarea individual con acciones
 */
const TaskItem = ({ 
  task, 
  onComplete, 
  onDelete, 
  onEdit,
  onViewDetails,
  draggable = false,
  onDragStart,
  className = ''
}) => {
  const { id, title, description, priority, completed, dueDate, category, tags = [] } = task;
  
  // Determinar clases de prioridad
  const priorityClasses = {
    alta: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    media: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    baja: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    none: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };
  
  // Determinar clases de categoría
  const categoryClasses = {
    trabajo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    personal: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    estudio: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    default: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };
  
  // Formatear fecha de vencimiento si existe
  const formattedDueDate = dueDate 
    ? formatDistanceToNow(new Date(dueDate), { addSuffix: true, locale: es })
    : null;
  
  // Verificar si la tarea está vencida
  const isOverdue = dueDate && new Date(dueDate) < new Date() && !completed;
  
  return (
    <div 
      className={`p-4 border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors ${className} ${completed ? 'bg-gray-50 dark:bg-dark-bg-tertiary/50' : ''}`}
      draggable={draggable}
      onDragStart={e => onDragStart && onDragStart(e, id)}
      data-task-id={id}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input 
            type="checkbox"
            checked={completed}
            onChange={() => onComplete(id, !completed)}
            className="h-5 w-5 text-primary focus:ring-primary border-gray-300 dark:border-dark-border rounded cursor-pointer"
            aria-label={`Marcar tarea ${title} como ${completed ? 'pendiente' : 'completada'}`}
          />
          
          <div className="ml-3">
            <div 
              className={`text-base font-medium ${completed 
                ? 'line-through text-gray-500 dark:text-dark-text-secondary' 
                : 'text-gray-900 dark:text-dark-text-primary'}`}
            >
              {title}
            </div>
            
            {description && (
              <div className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary line-clamp-2">
                {description}
              </div>
            )}
            
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              {priority && priority !== 'none' && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityClasses[priority] || priorityClasses.none}`}>
                  {priority}
                </span>
              )}
              
              {category && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryClasses[category] || categoryClasses.default}`}>
                  {category}
                </span>
              )}
              
              {formattedDueDate && (
                <span className={`text-xs flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formattedDueDate}
                </span>
              )}
              
              {tags && tags.length > 0 && tags.map(tag => (
                <span 
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onViewDetails(id)}
            className="text-gray-500 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors p-1"
            aria-label="Ver detalles"
            title="Ver detalles"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button 
            onClick={() => onEdit(id)}
            className="text-gray-500 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors p-1"
            aria-label="Editar tarea"
            title="Editar tarea"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button 
            onClick={() => onDelete(id)}
            className="text-gray-500 dark:text-dark-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
            aria-label="Eliminar tarea"
            title="Eliminar tarea"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    priority: PropTypes.string,
    completed: PropTypes.bool,
    dueDate: PropTypes.string,
    category: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  draggable: PropTypes.bool,
  onDragStart: PropTypes.func,
  className: PropTypes.string
};

export default TaskItem; 