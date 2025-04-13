import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

// Mapa de colores para prioridades
const PRIORITY_COLORS = {
  none: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
};

// Mapa de íconos para prioridades
const PRIORITY_ICONS = {
  none: null,
  low: <Clock className="h-3 w-3" />,
  medium: <Clock className="h-3 w-3" />,
  high: <AlertCircle className="h-3 w-3" />
};

/**
 * Componente para mostrar una tarea en el calendario
 * 
 * @param {Object} props
 * @param {Object} props.task - Datos de la tarea
 * @param {Function} props.onClick - Función para manejar el clic en la tarea
 * @param {boolean} props.compact - Si es true, muestra una versión compacta (para vista mensual)
 * @param {boolean} props.detailed - Si es true, muestra una versión detallada (para vista diaria)
 */
const CalendarTask = ({ task, onClick, compact = false, detailed = false }) => {
  // Obtener colores según la prioridad
  const priorityColor = PRIORITY_COLORS[task.priority || 'none'];
  const priorityIcon = PRIORITY_ICONS[task.priority || 'none'];
  
  // Componente para el estado completado/pendiente
  const StatusIcon = () => {
    if (task.completed) {
      return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />;
    }
    return <Circle className="h-4 w-4 text-gray-400" />;
  };
  
  // Versión compacta para calendario mensual
  if (compact) {
    return (
      <div
        className={`px-1.5 py-0.5 rounded-sm text-xs truncate cursor-pointer hover:opacity-90 ${priorityColor} ${
          task.completed ? 'line-through opacity-70' : ''
        }`}
        onClick={onClick}
        title={task.title}
      >
        {task.title}
      </div>
    );
  }
  
  // Versión detallada para vista diaria
  if (detailed) {
    return (
      <div
        className={`p-3 rounded-md cursor-pointer hover:shadow-md transition border border-l-4 ${
          task.completed 
            ? 'border-green-300 dark:border-green-800 border-l-green-500' 
            : 'border-gray-200 dark:border-gray-700 border-l-indigo-500'
        } bg-white dark:bg-gray-800`}
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
          <StatusIcon />
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
              {task.title}
            </h4>
            
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {task.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {task.category}
                </span>
              )}
              
              {task.priority && task.priority !== 'none' && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded gap-1 ${priorityColor}`}>
                  {priorityIcon}
                  <span className="capitalize">{task.priority}</span>
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Versión normal para vista semanal
  return (
    <div
      className={`p-2 rounded-md cursor-pointer hover:shadow-md transition ${priorityColor} ${
        task.completed ? 'opacity-70' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <StatusIcon />
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm truncate ${task.completed ? 'line-through' : ''}`}>
            {task.title}
          </h4>
          {task.category && (
            <div className="text-xs mt-1 opacity-80">
              {task.category}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarTask; 