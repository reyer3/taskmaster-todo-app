import React from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Circle, Eye, Edit, Trash2, Clock } from 'lucide-react';

// Mapeo de prioridades para mostrar en español
const PRIORITY_MAP = {
  'high': 'Alta',
  'medium': 'Media',
  'low': 'Baja',
  'none': 'Sin prioridad'
};

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
          <button 
            onClick={() => onComplete(id, !completed)}
            className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full transition-all duration-200 ${
              completed 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={`Marcar tarea ${title} como ${completed ? 'pendiente' : 'completada'}`}
          >
            {completed ? (
              <CheckCircle size={16} className="stroke-2" />
            ) : (
              <Circle size={16} className="stroke-2" />
            )}
          </button>
          
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
                  {PRIORITY_MAP[priority] || priority}
                </span>
              )}
              
              {category && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryClasses[category] || categoryClasses.default}`}>
                  {category}
                </span>
              )}
              
              {formattedDueDate && (
                <span className={`text-xs flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
                  <Clock size={12} className="mr-1" />
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
            <Eye size={18} />
          </button>
          
          <button 
            onClick={() => onEdit(id)}
            className="text-gray-500 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors p-1"
            aria-label="Editar tarea"
            title="Editar tarea"
          >
            <Edit size={18} />
          </button>
          
          <button 
            onClick={() => onDelete(id)}
            className="text-gray-500 dark:text-dark-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
            aria-label="Eliminar tarea"
            title="Eliminar tarea"
          >
            <Trash2 size={18} />
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