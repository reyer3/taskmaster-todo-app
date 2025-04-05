import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../context/ToastContext';
import TaskList from './TaskList';
import TaskDetail from './TaskDetail';
import { TaskForm } from './forms';
import Modal from '../../../components/common/Modal';
import { getTasks, createTask, updateTask, deleteTask, markTaskAsCompleted, markTaskAsPending } from '../services/tasks.service';

// Mapeo de prioridades para mostrar en español
const PRIORITY_MAP = {
  'none': 'Ninguna',
  'low': 'Baja',
  'medium': 'Media',
  'high': 'Alta'
};

/**
 * Página principal de gestión de tareas
 * Permite crear, ver, editar, eliminar y organizar tareas
 */
const TasksPage = () => {
  // Estados
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    searchQuery: ''
  });
  
  // Estados para modales
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { success, error: showError } = useToast();
  
  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks();
  }, []);
  
  // Actualizar tareas filtradas cuando cambian las tareas o filtros
  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);
  
  // Función para cargar tareas desde el API
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTasks = await getTasks();
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setError('No se pudieron cargar las tareas. Por favor, intenta de nuevo más tarde.');
      showError('Error al cargar tareas');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Aplicar filtros a las tareas
  const applyFilters = useCallback(() => {
    let result = [...tasks];
    
    // Filtrar por estado
    if (filters.status !== 'all') {
      const isCompleted = filters.status === 'completed';
      result = result.filter(task => task.completed === isCompleted);
    }
    
    // Filtrar por prioridad
    if (filters.priority !== 'all') {
      result = result.filter(task => task.priority === filters.priority);
    }
    
    // Filtrar por categoría
    if (filters.category !== 'all') {
      result = result.filter(task => task.category === filters.category);
    }
    
    // Filtrar por texto de búsqueda
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(task => 
        (task.title && task.title.toLowerCase().includes(query)) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredTasks(result);
  }, [tasks, filters]);
  
  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar la búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    // La búsqueda ya se aplica en tiempo real a través del efecto de filtrado
  };
  
  // Manejar reordenamiento de tareas (drag & drop)
  const handleTasksReorder = (reorderedTasks) => {
    setTasks(reorderedTasks);
    success('Tareas reordenadas');
    // Aquí se puede implementar la lógica para guardar el orden en la API
  };
  
  // Marcar tarea como completada/pendiente
  const handleToggleTaskComplete = async (taskId, isComplete) => {
    try {
      let updatedTask;
      
      if (isComplete) {
        updatedTask = await markTaskAsCompleted(taskId);
      } else {
        updatedTask = await markTaskAsPending(taskId);
      }
      
      // Actualizar la lista de tareas
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: isComplete } : task
      ));
      
      // Si la tarea está siendo vista en detalle, actualizar también
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, completed: isComplete });
      }
      
      success(`Tarea marcada como ${isComplete ? 'completada' : 'pendiente'}`);
    } catch (err) {
      console.error('Error al cambiar estado de la tarea:', err);
      showError('Error al actualizar la tarea');
    }
  };
  
  // Ver detalles de una tarea
  const handleViewTaskDetails = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetail(true);
    }
  };
  
  // Cerrar vista de detalles
  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    setShowTaskDetail(false);
  };
  
  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };
  
  // Abrir modal de edición
  const handleOpenEditModal = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowEditModal(true);
      
      // Si estábamos viendo los detalles, cerrar la vista
      setShowTaskDetail(false);
    }
  };
  
  // Abrir modal de eliminación
  const handleOpenDeleteModal = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowDeleteModal(true);
      
      // Si estábamos viendo los detalles, cerrar la vista
      setShowTaskDetail(false);
    }
  };
  
  // Crear una nueva tarea
  const handleCreateTask = async (taskData) => {
    setIsSubmitting(true);
    
    try {
      const newTask = await createTask(taskData);
      
      // Actualizar lista de tareas
      setTasks([newTask, ...tasks]);
      
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
      
      // Actualizar tarea seleccionada si es necesario
      if (selectedTask && selectedTask.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
      
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
      setTasks(tasks.filter(task => task.id !== selectedTask.id));
      
      // Cerrar modal
      setShowDeleteModal(false);
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
    setIsSubmitting(false);
  };
  
  // Calcular categorías disponibles para filtrado
  const availableCategories = React.useMemo(() => {
    const categories = new Set(tasks.map(task => task.category).filter(Boolean));
    return Array.from(categories);
  }, [tasks]);
  
  // Renderizar componente
  return (
    <div className="tasks-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4 md:mb-0">
          Mis Tareas
        </h1>
        
        <button
          onClick={handleOpenCreateModal}
          className="btn-primary md:self-end px-4 py-2 rounded-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nueva Tarea</span>
        </button>
      </div>
      
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Estado
          </label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="block w-full bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-md shadow-sm p-2 text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Prioridad
          </label>
          <select
            id="priority-filter"
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="block w-full bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-md shadow-sm p-2 text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
            <option value="none">Sin prioridad</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Categoría
          </label>
          <select
            id="category-filter"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="block w-full bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-md shadow-sm p-2 text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="personal">Personal</option>
            <option value="trabajo">Trabajo</option>
            <option value="estudio">Estudio</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
            Buscar
          </label>
          <form onSubmit={handleSearch} className="relative flex">
            <input
              type="text"
              id="search-input"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Buscar tareas..."
              className="block w-full bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-md shadow-sm py-2 px-3 pr-10 text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-text-secondary"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
      
      {/* Lista de tareas con mejor espaciado para el footer */}
      <div className="tasks-container">
        <TaskList
          tasks={filteredTasks}
          onTaskComplete={(taskId) => handleToggleTaskComplete(taskId, true)}
          onTaskDelete={handleOpenDeleteModal}
          onTaskEdit={handleOpenEditModal}
          onTaskView={handleViewTaskDetails}
          onTasksReorder={handleTasksReorder}
          loading={isLoading}
          error={error}
          emptyMessage="No hay tareas que coincidan con los filtros seleccionados."
        />
      </div>
      
      {/* Divisor visual antes del footer */}
      <div className="content-footer-divider"></div>
      
      {/* Modal para ver detalles de tarea */}
      <Modal 
        isOpen={showTaskDetail} 
        onClose={handleCloseTaskDetails}
        title="Detalles de la tarea"
        size="lg"
      >
        <TaskDetail 
          task={selectedTask}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onBack={handleCloseTaskDetails}
          onToggleComplete={handleToggleTaskComplete}
        />
      </Modal>
      
      {/* Modal para creación de tarea */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={handleCancel}
        title="Crear nueva tarea"
        size="lg"
      >
        <TaskForm 
          onSubmit={handleCreateTask}
          onCancel={handleCancel}
          categories={availableCategories.length ? availableCategories : ['personal', 'trabajo', 'estudio']}
          loading={isSubmitting}
        />
      </Modal>
      
      {/* Modal para edición de tarea */}
      <Modal 
        isOpen={showEditModal} 
        onClose={handleCancel}
        title="Editar tarea"
        size="lg"
      >
        <TaskForm 
          task={selectedTask}
          onSubmit={handleUpdateTask}
          onCancel={handleCancel}
          categories={availableCategories.length ? availableCategories : ['personal', 'trabajo', 'estudio']}
          loading={isSubmitting}
        />
      </Modal>
      
      {/* Modal para confirmación de eliminación */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={handleCancel}
        title="Eliminar tarea"
        size="md"
      >
        <div className="p-6">
          <p className="mb-6 text-gray-700 dark:text-dark-text-secondary">
            ¿Estás seguro de que deseas eliminar la tarea <span className="font-medium">{selectedTask?.title}</span>?
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteTask}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksPage; 