import React, { useState, useEffect } from 'react';

/**
 * Widget de calendario de actividad
 * Muestra un heatmap simple de actividad por día
 */
const ActivityCalendar = () => {
  const [activityData, setActivityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadActivityData = () => {
      setIsLoading(true);
      
      // Simulación de carga de datos
      setTimeout(() => {
        // Generar datos de actividad para los últimos 30 días
        const today = new Date();
        const data = [];
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          
          // Generar un número aleatorio de actividades (0-5)
          const count = Math.floor(Math.random() * 6);
          
          data.push({
            date: date.toISOString().split('T')[0],
            count: count
          });
        }
        
        setActivityData(data);
        setIsLoading(false);
      }, 800);
    };
    
    loadActivityData();
  }, []);
  
  // Función para determinar el color basado en la cantidad de actividades
  const getActivityColor = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (count === 1) return 'bg-green-100 dark:bg-green-900';
    if (count === 2) return 'bg-green-200 dark:bg-green-800';
    if (count === 3) return 'bg-green-300 dark:bg-green-700';
    if (count === 4) return 'bg-green-400 dark:bg-green-600';
    return 'bg-green-500 dark:bg-green-500';
  };
  
  // Función para obtener el nombre del día
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'short' });
  };
  
  // Función para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Calendario de Actividad
        </h2>
        <div className="animate-pulse h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Calendario de Actividad
      </h2>
      
      <div className="flex flex-wrap justify-between">
        {activityData.map((day, index) => (
          <div 
            key={day.date} 
            className="w-8 mb-4 flex flex-col items-center"
            title={`${formatDate(day.date)}: ${day.count} actividades`}
          >
            <div 
              className={`w-6 h-6 rounded-sm ${getActivityColor(day.count)}`}
            ></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {index % 6 === 0 ? getDayName(day.date) : ''}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
        <span className="mr-2">Menos</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900"></div>
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800"></div>
          <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500"></div>
        </div>
        <span className="ml-2">Más</span>
      </div>
    </div>
  );
};

export default ActivityCalendar; 