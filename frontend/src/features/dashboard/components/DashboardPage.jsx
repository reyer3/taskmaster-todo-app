import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import RecentTasksWidget from './RecentTasksWidget';
import ActivityCalendar from './ActivityCalendar';
import { getDashboardStats } from '../services/dashboard.service';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';

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

  // Cargar datos iniciales del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener estadísticas del dashboard
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
        
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
          icon={<ClipboardList size={24} />}
          color="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-500 dark:text-blue-300"
        />
        <StatCard 
          title="Tareas Completadas" 
          value={stats.completedTasks} 
          icon={<CheckCircle size={24} />}
          color="bg-green-100 dark:bg-green-900"
          iconColor="text-green-500 dark:text-green-300"
        />
        <StatCard 
          title="Tareas Pendientes" 
          value={stats.pendingTasks} 
          icon={<Clock size={24} />}
          color="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-500 dark:text-yellow-300"
        />
        <StatCard 
          title="Vencen Pronto" 
          value={stats.dueSoonTasks} 
          icon={<AlertCircle size={24} />}
          color="bg-red-100 dark:bg-red-900"
          iconColor="text-red-500 dark:text-red-300"
        />
      </div>

      {/* Contenedor para widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTasksWidget limit={5} />
        <ActivityCalendar />
      </div>
    </div>
  );
};

/**
 * Tarjeta de estadísticas para el dashboard
 */
const StatCard = ({ title, value, icon, color, iconColor }) => {
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
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 