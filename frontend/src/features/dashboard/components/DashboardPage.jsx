import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import RecentTasksWidget from './RecentTasksWidget';
import ActivityCalendar from './ActivityCalendar';
import TaskFilter from './TaskFilter';

/**
 * Página principal del dashboard
 * Muestra un resumen de las tareas y widgets estadísticos
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    dueSoonTasks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filteredResults, setFilteredResults] = useState([]);

  useEffect(() => {
    // Simulación de carga de datos del dashboard
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Aquí iría la llamada a la API para obtener los datos del dashboard
        // Por ahora usamos datos simulados
        setTimeout(() => {
          setStats({
            totalTasks: 12,
            completedTasks: 5,
            pendingTasks: 7,
            dueSoonTasks: 3
          });
          
          // Simulación de resultados iniciales
          setFilteredResults([
            { id: 1, title: 'Completar informe mensual', status: 'pending', dueDate: '2023-04-10' },
            { id: 2, title: 'Reunión con equipo de diseño', status: 'completed', dueDate: '2023-04-05' },
            { id: 3, title: 'Revisar propuesta de cliente', status: 'pending', dueDate: '2023-04-12' }
          ]);
          
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudieron cargar los datos del dashboard'
        });
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [addToast]);

  const handleFilterChange = (filters) => {
    console.log('Aplicando filtros:', filters);
    
    // Aquí iría la lógica para filtrar tareas según los criterios
    // Por ahora solo mostramos una notificación
    addToast({
      type: 'info',
      title: 'Filtros aplicados',
      message: `Búsqueda: "${filters.searchQuery || 'ninguna'}" | Estado: ${filters.status || 'todos'} | Prioridad: ${filters.priority || 'todas'}`
    });
  };

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

      {/* Componente de búsqueda y filtros */}
      <div className="mb-8">
        <TaskFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Contenedor para widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentTasksWidget limit={5} />
        <ActivityCalendar />
      </div>

      {/* Resultados de búsqueda/filtrado */}
      {filteredResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Resultados
          </h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Tarea</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Fecha de vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(task => (
                <tr key={task.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 text-gray-800 dark:text-white">{task.title}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                    }`}>
                      {task.status === 'completed' ? 'Completada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-300">
                    {new Date(task.dueDate).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/**
 * Tarjeta de estadísticas para el dashboard
 */
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`rounded-lg shadow p-6 ${color} text-gray-800 dark:text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
};

export default DashboardPage; 