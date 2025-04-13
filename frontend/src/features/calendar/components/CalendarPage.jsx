import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import MonthCalendar from './MonthCalendar';
import WeekCalendar from './WeekCalendar';
import DayView from './DayView';
import { TaskForm } from '../../tasks/components/forms';
import Modal from '../../../components/common/Modal';
import { getTasksByDateRange, organizeTasksByDate } from '../services/calendar.service';
import { createTask, updateTask, deleteTask } from '../../tasks/services/tasks.service';

// Iconos y componentes de UI
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

// Tipos de vista
const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
};

// Hook personalizado para gestionar las tareas del calendario
const useCalendarTasks = (currentDate, viewType) => {
  const [tasks, setTasks] = useState([]);
  const [tasksByDate, setTasksByDate] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: showError } = useToast();

  // Función para obtener el rango de fechas según la vista
  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewType === VIEW_TYPES.MONTH) {
      // Para la vista mensual, abarcamos todo el mes y algunos días de los meses adyacentes
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Ajustar para incluir semanas completas
      const startDate = new Date(firstDay);
      startDate.setDate(1 - firstDay.getDay()); // Retroceder al primer día de la semana
      
      const endDate = new Date(lastDay);
      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // Avanzar al último día de la semana
      
      return { startDate, endDate };
    } else if (viewType === VIEW_TYPES.WEEK) {
      // Para la vista semanal, obtenemos los 7 días de la semana actual
      const dayOfWeek = currentDate.getDay();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - dayOfWeek);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      return { startDate, endDate };
    } else {
      // Para la vista diaria, solo usamos el día seleccionado
      return { 
        startDate: new Date(currentDate.setHours(0, 0, 0, 0)), 
        endDate: new Date(currentDate.setHours(23, 59, 59, 999)) 
      };
    }
  };
  
  // Cargar tareas
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { startDate, endDate } = getDateRange();
      const fetchedTasks = await getTasksByDateRange(startDate, endDate);
      
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
      setTasksByDate(organizeTasksByDate(fetchedTasks));
    } catch (err) {
      console.error('Error al cargar tareas del calendario:', err);
      setError('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.');
      showError('Error al cargar tareas del calendario');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar tareas al cambiar la fecha o el tipo de vista
  useEffect(() => {
    fetchTasks();
  }, [currentDate, viewType]);

  return {
    tasks,
    setTasks,
    tasksByDate,
    setTasksByDate,
    isLoading,
    error
  };
};

// Hook personalizado para manejar operaciones con tareas
const useTaskOperations = (tasks, setTasks, tasksByDate, setTasksByDate) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { success, error: showError } = useToast();
  
  // Seleccionar una tarea
  const handleTaskSelect = (task) => {
    console.log("Task selected for edit:", task);
    setSelectedTask(task);
    setShowEditModal(true);
  };
  
  // Abrir modal para crear una tarea en la fecha seleccionada
  const handleCreateTaskForDate = (date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };
  
  // Crear una nueva tarea
  const handleCreateTask = async (taskData) => {
    setIsSubmitting(true);
    
    try {
      // Asignar la fecha seleccionada
      const newTaskData = {
        ...taskData,
        dueDate: selectedDate.toISOString().split('T')[0]
      };
      
      const newTask = await createTask(newTaskData);
      
      // Actualizar lista de tareas
      setTasks([...tasks, newTask]);
      
      // Actualizar agrupación por fechas
      const updatedTasksByDate = { ...tasksByDate };
      const dateKey = newTask.dueDate.split('T')[0];
      
      if (!updatedTasksByDate[dateKey]) {
        updatedTasksByDate[dateKey] = [];
      }
      
      updatedTasksByDate[dateKey].push(newTask);
      setTasksByDate(updatedTasksByDate);
      
      // Cerrar modal
      setShowCreateModal(false);
      success('Tarea creada correctamente');
    } catch (err) {
      console.error('Error al crear tarea:', err);
      showError('Error al crear la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Actualizar una tarea existente
  const handleUpdateTask = async (taskData) => {
    setIsSubmitting(true);
    
    try {
      const updatedTask = await updateTask(taskData.id, taskData);
      
      // Actualizar lista de tareas
      setTasks(tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      
      // Actualizar agrupación por fechas
      const updatedTasksByDate = organizeTasksByDate(
        tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
      setTasksByDate(updatedTasksByDate);
      
      // Cerrar modal
      setShowEditModal(false);
      success('Tarea actualizada correctamente');
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      showError('Error al actualizar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Eliminar una tarea
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteTask(selectedTask.id);
      
      // Actualizar lista de tareas
      const updatedTasks = tasks.filter(task => task.id !== selectedTask.id);
      setTasks(updatedTasks);
      
      // Actualizar agrupación por fechas
      const updatedTasksByDate = organizeTasksByDate(updatedTasks);
      setTasksByDate(updatedTasksByDate);
      
      // Cerrar modales
      setShowDeleteModal(false);
      setShowEditModal(false);
      setSelectedTask(null);
      
      success('Tarea eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      showError('Error al eliminar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancelar operaciones
  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedTask(null);
    setSelectedDate(null);
  };
  
  // Manejador para mostrar el modal de confirmación de eliminación
  const handleShowDeleteModal = () => {
    setShowEditModal(false);
    setShowDeleteModal(true);
  };
  
  return {
    selectedDate,
    setSelectedDate,
    selectedTask,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    isSubmitting,
    handleTaskSelect,
    handleCreateTaskForDate,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleCancel,
    handleShowDeleteModal
  };
};

// Hook personalizado para manejar la navegación del calendario
const useCalendarNavigation = (initialView = VIEW_TYPES.MONTH) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState(initialView);
  
  // Cambiar al mes/semana/día anterior
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    
    if (viewType === VIEW_TYPES.MONTH) {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === VIEW_TYPES.WEEK) {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    setCurrentDate(newDate);
  };
  
  // Cambiar al mes/semana/día siguiente
  const handleNext = () => {
    const newDate = new Date(currentDate);
    
    if (viewType === VIEW_TYPES.MONTH) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === VIEW_TYPES.WEEK) {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    setCurrentDate(newDate);
  };
  
  // Cambiar a la fecha actual
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Cambiar el tipo de vista
  const handleViewChange = (newView) => {
    setViewType(newView);
  };
  
  // Seleccionar una fecha específica
  const handleDateSelect = (date, setSelectedDate) => {
    setSelectedDate(date);
    setCurrentDate(date);
    
    // Si hacemos clic en un día específico, cambiamos a la vista diaria
    if (viewType === VIEW_TYPES.MONTH) {
      setViewType(VIEW_TYPES.DAY);
    }
  };
  
  return {
    currentDate,
    setCurrentDate,
    viewType,
    setViewType,
    handlePrevious,
    handleNext,
    handleToday,
    handleViewChange,
    handleDateSelect
  };
};

// Componente para el encabezado del calendario
const CalendarHeader = ({ currentDate, viewType, onViewChange, onPrevious, onNext, onToday }) => {
  // Formatear el título según la vista
  const getViewTitle = () => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    if (viewType === VIEW_TYPES.MONTH) {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewType === VIEW_TYPES.WEEK) {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      return `${startDate.getDate()} ${monthNames[startDate.getMonth()]} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return `${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CalendarIcon className="h-6 w-6" />
        <span>Calendario de Tareas</span>
      </h1>
      
      <div className="flex items-center gap-4">
        <button
          onClick={onToday}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Hoy
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-medium min-w-[180px] text-center">
            {getViewTitle()}
          </h2>
          
          <button
            onClick={onNext}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium rounded-l-md ${
            viewType === VIEW_TYPES.MONTH
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onViewChange(VIEW_TYPES.MONTH)}
        >
          Mes
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium ${
            viewType === VIEW_TYPES.WEEK
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onViewChange(VIEW_TYPES.WEEK)}
        >
          Semana
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium rounded-r-md ${
            viewType === VIEW_TYPES.DAY
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onViewChange(VIEW_TYPES.DAY)}
        >
          Día
        </button>
      </div>
    </div>
  );
};

// Componente para los modales de tareas
const TaskModals = ({ 
  showCreateModal, 
  showEditModal, 
  showDeleteModal, 
  selectedTask, 
  selectedDate, 
  isSubmitting, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask, 
  onCancel 
}) => {
  return (
    <>
      {/* Modal para crear tarea */}
      <Modal 
        isOpen={showCreateModal}
        title="Crear nueva tarea" 
        onClose={onCancel}
      >
        <TaskForm 
          onSubmit={onCreateTask} 
          loading={isSubmitting}
          onCancel={onCancel}
          initialValues={{
            dueDate: selectedDate ? selectedDate.toISOString().split('T')[0] : ''
          }}
        />
      </Modal>
      
      {/* Modal para editar tarea */}
      <Modal 
        isOpen={showEditModal && selectedTask !== null}
        title="Editar tarea" 
        onClose={onCancel}
      >
        {selectedTask && (
          <>
            <TaskForm 
              task={selectedTask}
              onSubmit={onUpdateTask} 
              loading={isSubmitting}
              onCancel={onCancel}
            />
            <div className="flex justify-end mt-4 border-t pt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={() => {
                  setShowEditModal(false);
                  setShowDeleteModal(true);
                }}
              >
                Eliminar tarea
              </button>
            </div>
          </>
        )}
      </Modal>
      
      {/* Modal para confirmar eliminación */}
      <Modal 
        isOpen={showDeleteModal && selectedTask !== null}
        title="Confirmar eliminación" 
        onClose={onCancel}
      >
        <div className="p-4">
          <p className="mb-4">
            ¿Estás seguro de que deseas eliminar la tarea "{selectedTask?.title}"?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              onClick={onDeleteTask}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Componente para las vistas del calendario
const CalendarView = ({ 
  viewType, 
  currentDate, 
  tasksByDate, 
  onDateSelect, 
  onTaskSelect, 
  onCreateTask 
}) => {
  if (viewType === VIEW_TYPES.MONTH) {
    return (
      <MonthCalendar
        currentDate={currentDate}
        tasks={tasksByDate}
        onDateSelect={onDateSelect}
        onTaskSelect={onTaskSelect}
        onCreateTask={onCreateTask}
      />
    );
  } else if (viewType === VIEW_TYPES.WEEK) {
    return (
      <WeekCalendar
        currentDate={currentDate}
        tasks={tasksByDate}
        onDateSelect={onDateSelect}
        onTaskSelect={onTaskSelect}
        onCreateTask={onCreateTask}
      />
    );
  } else {
    return (
      <DayView
        currentDate={currentDate}
        tasks={tasksByDate}
        onTaskSelect={onTaskSelect}
        onCreateTask={() => onCreateTask(currentDate)}
      />
    );
  }
};

/**
 * Página principal de calendario
 * Muestra las tareas organizadas por fechas en distintos formatos
 */
const CalendarPage = () => {
  // Usar hooks personalizados
  const {
    currentDate,
    viewType,
    handlePrevious,
    handleNext,
    handleToday,
    handleViewChange,
    handleDateSelect
  } = useCalendarNavigation();
  
  const { 
    tasks, 
    setTasks, 
    tasksByDate, 
    setTasksByDate, 
    isLoading, 
    error 
  } = useCalendarTasks(currentDate, viewType);
  
  const {
    selectedDate,
    setSelectedDate,
    selectedTask,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    isSubmitting,
    handleTaskSelect,
    handleCreateTaskForDate,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleCancel
  } = useTaskOperations(tasks, setTasks, tasksByDate, setTasksByDate);
  
  return (
    <div className="container mx-auto px-4 pt-16 pb-6">
      <CalendarHeader 
        currentDate={currentDate}
        viewType={viewType}
        onViewChange={handleViewChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="mt-6">
          <CalendarView
            viewType={viewType}
            currentDate={currentDate}
            tasksByDate={tasksByDate}
            onDateSelect={(date) => handleDateSelect(date, setSelectedDate)}
            onTaskSelect={handleTaskSelect}
            onCreateTask={handleCreateTaskForDate}
          />
        </div>
      )}
      
      <TaskModals
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        selectedTask={selectedTask}
        selectedDate={selectedDate}
        isSubmitting={isSubmitting}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CalendarPage; 