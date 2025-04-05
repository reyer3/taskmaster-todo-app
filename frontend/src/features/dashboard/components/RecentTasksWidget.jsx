import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentTasks } from '../services/dashboard.service';

/**
 * Widget que muestra las tareas más recientes
 */
const RecentTasksWidget = ({ limit = 5 }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecentTasks = async () => {
      try {
        setIsLoading(true);
        // Obtener tareas recientes del servicio
        const recentTasks = await getRecentTasks(limit);
        setTasks(recentTasks);
        setIsLoading(false);
      } catch (error) {
        console.error('Error cargando tareas recientes:', error);
        setIsLoading(false);
      }
    };

    loadRecentTasks();
  }, [limit]);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const getStatusClass = (status) => {
    return status === 'completed' 
      ? 'line-through text-gray-500 dark:text-gray-400' 
      : 'text-gray-800 dark:text-white';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Tareas Recientes
        </h2>
        <div className="animate-pulse">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex justify-between items-center">
        <span>Tareas Recientes</span>
        <Link to="/tasks" className="text-sm text-primary hover:underline">
          Ver todas
        </Link>
      </h2>

      {tasks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-6">
          No hay tareas recientes
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {tasks.map(task => (
            <li key={task.id} className="py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-medium ${getStatusClass(task.status)}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Creada el {formatDate(task.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                  {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentTasksWidget; 