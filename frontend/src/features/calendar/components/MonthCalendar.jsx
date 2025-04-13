import React from 'react';
import { getCalendarDays, isSameDay } from '../services/calendar.service';
import CalendarTask from './CalendarTask';
import { PlusCircle } from 'lucide-react';

/**
 * Componente para mostrar un calendario mensual
 * 
 * @param {Object} props
 * @param {Date} props.currentDate - Fecha actual seleccionada
 * @param {Object} props.tasks - Tareas organizadas por fecha
 * @param {Function} props.onDateSelect - Función para manejar la selección de fecha
 * @param {Function} props.onTaskSelect - Función para manejar la selección de tarea
 * @param {Function} props.onCreateTask - Función para crear una tarea en una fecha específica
 */
const MonthCalendar = ({ currentDate, tasks, onDateSelect, onTaskSelect, onCreateTask }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Obtener días del calendario
  const days = getCalendarDays(year, month);
  
  // Días de la semana
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Obtener las tareas para un día específico
  const getTasksForDay = (date) => {
    if (!tasks) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return tasks[dateString] || [];
  };
  
  // Determinar si un día está en el pasado
  const isPastDay = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-700">
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className="py-2 font-medium text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Cuadrícula del calendario */}
      <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr min-h-[650px]">
        {days.map((dayInfo, index) => {
          const { date, isCurrentMonth, isToday } = dayInfo;
          const dayTasks = getTasksForDay(date);
          const isPast = isPastDay(date);
          
          return (
            <div 
              key={index} 
              className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 ${
                isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500'
              } ${
                isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''
              }`}
              onClick={() => onDateSelect(date)}
            >
              <div className="flex justify-between items-start">
                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm ${
                  isToday 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {date.getDate()}
                </span>
                
                <button
                  className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask(date);
                  }}
                  aria-label="Crear tarea"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              </div>
              
              {/* Lista de tareas del día */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px]">
                {dayTasks.map(task => (
                  <CalendarTask
                    key={task.id}
                    task={task}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskSelect(task);
                    }}
                    compact
                  />
                ))}
                
                {dayTasks.length > 3 && (
                  <button 
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline w-full text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSelect(date);
                    }}
                  >
                    Ver {dayTasks.length - 3} más...
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar; 