import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import RecentTasksWidget from './RecentTasksWidget';
import ActivityCalendar from './ActivityCalendar';
import { getDashboardStats, searchTasks } from '../services/dashboard.service';

/**
 * Página principal del dashboard
 * Muestra un resumen de las tareas y widgets estadísticos
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const { showToast, error: showError } = useToast();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    dueSoonTasks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);

  // Cargar datos iniciales del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas del dashboard
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
        
        // Cargar tareas recientes
        const initialResults = await searchTasks({ dateRange: 'month' });
        setRecentTasks(initialResults.slice(0, 5));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showError('No se pudieron cargar los datos del dashboard');
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [showError]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          ¡Bienvenido{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Este es un resumen de tus actividades y tareas.
        </p>
      </header>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total de Tareas" 
          value={stats.totalTasks} 
          icon="📋"
          color="bg-blue-100 dark:bg-blue-900"
        />
        <StatCard 
          title="Tareas Completadas" 
          value={stats.completedTasks} 
          icon="✅"
          color="bg-green-100 dark:bg-green-900"
        />
        <StatCard 
          title="Tareas Pendientes" 
          value={stats.pendingTasks} 
          icon="⏳"
          color="bg-yellow-100 dark:bg-yellow-900"
        />
        <StatCard 
          title="Vencen Pronto" 
          value={stats.dueSoonTasks} 
          icon="⏰"
          color="bg-red-100 dark:bg-red-900"
        />
      </div>

      {/* Contenedor para widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentTasksWidget limit={5} />
        <ActivityCalendar />
      </div>

      {/* Tareas recientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Tareas recientes
          </h2>
        </div>
        
        {recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2">Tarea</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2">Fecha de vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(task => (
                  <tr key={task.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 text-gray-800 dark:text-white">{task.title}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'completed' || task.completed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}>
                        {task.status === 'completed' || task.completed ? 'Completada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">
                      {task.dueDate 
                        ? new Date(task.dueDate).toLocaleDateString('es-ES')
                        : 'Sin fecha'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-2 text-2xl">📋</p>
            <p className="text-lg font-medium">No hay tareas recientes</p>
            <p className="text-sm mt-2">Crea nuevas tareas para verlas aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tarjeta de estadísticas para el dashboard
 */
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`${color} rounded-lg p-6 transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-gray-800 dark:text-white">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
        </div>
        <div className="text-3xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 