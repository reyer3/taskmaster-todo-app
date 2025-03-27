import { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getTasks, createTask, updateTask, deleteTask } from '../features/tasks/services/tasks.service';

// Creación del contexto
export const TasksContext = createContext();

/**
 * Proveedor del contexto de tareas
 * Maneja el estado y operaciones CRUD de las tareas
 */
export const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'completed', 'pending'
    category: 'all', // 'all', 'personal', 'trabajo', 'estudios'
    search: ''
  });
  
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  /**
   * Carga las tareas cuando el usuario está autenticado
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Obtiene las tareas del servidor
   */
  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      const message = err.message || 'Error al cargar las tareas';
      setError(message);
      showToast({
        type: 'error',
        message
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crea una nueva tarea
   * @param {Object} taskData - Datos de la tarea a crear
   * @returns {Promise<Object>} Tarea creada
   */
  const addTask = async (taskData) => {
    setError(null);
    
    try {
      const newTask = await createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      showToast({
        type: 'success',
        message: 'Tarea creada exitosamente'
      });
      return newTask;
    } catch (err) {
      const message = err.message || 'Error al crear la tarea';
      setError(message);
      showToast({
        type: 'error',
        message
      });
      throw err;
    }
  };

  /**
   * Actualiza una tarea existente
   * @param {number} id - ID de la tarea a actualizar
   * @param {Object} taskData - Datos actualizados de la tarea
   * @returns {Promise<Object>} Tarea actualizada
   */
  const editTask = async (id, taskData) => {
    setError(null);
    
    try {
      const updatedTask = await updateTask(id, taskData);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      showToast({
        type: 'success',
        message: 'Tarea actualizada exitosamente'
      });
      return updatedTask;
    } catch (err) {
      const message = err.message || 'Error al actualizar la tarea';
      setError(message);
      showToast({
        type: 'error',
        message
      });
      throw err;
    }
  };

  /**
   * Marca una tarea como completada o pendiente
   * @param {number} id - ID de la tarea a cambiar
   * @param {boolean} completed - Estado de completitud
   * @returns {Promise<Object>} Tarea actualizada
   */
  const toggleTaskCompletion = async (id, completed) => {
    return editTask(id, { completed });
  };

  /**
   * Elimina una tarea
   * @param {number} id - ID de la tarea a eliminar
   * @returns {Promise<void>}
   */
  const removeTask = async (id) => {
    setError(null);
    
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      showToast({
        type: 'success',
        message: 'Tarea eliminada exitosamente'
      });
    } catch (err) {
      const message = err.message || 'Error al eliminar la tarea';
      setError(message);
      showToast({
        type: 'error',
        message
      });
      throw err;
    }
  };

  /**
   * Actualiza los filtros de tareas
   * @param {Object} newFilters - Nuevos filtros a aplicar
   */
  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  /**
   * Aplica los filtros a las tareas
   * @returns {Array} Tareas filtradas
   */
  const filteredTasks = tasks.filter(task => {
    // Filtrar por estado
    if (filters.status === 'completed' && !task.completed) return false;
    if (filters.status === 'pending' && task.completed) return false;
    
    // Filtrar por categoría
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    
    // Filtrar por búsqueda
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    return true;
  });

  // Valores proporcionados por el contexto
  const value = {
    tasks: filteredTasks,
    isLoading,
    error,
    filters,
    fetchTasks,
    addTask,
    editTask,
    toggleTaskCompletion,
    removeTask,
    updateFilters
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};
