import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import TaskItem from '../TaskItem';

/**
 * Componente que muestra una lista de tareas con soporte para drag and drop
 */
const TaskList = ({
  tasks = [],
  onTaskComplete,
  onTaskDelete,
  onTaskEdit,
  onTaskView,
  onTasksReorder,
  loading = false,
  error = null,
  emptyMessage = "No hay tareas para mostrar"
}) => {
  // Estado para drag and drop
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  
  // Manejar inicio de arrastre
  const handleDragStart = useCallback((e, taskId) => {
    setDraggedTaskId(taskId);
    // Establecer la imagen de arrastre y datos
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Añadir clase para estilo durante arrastre
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.classList.add('opacity-50');
    }
  }, []);
  
  // Manejar entrada en zona de destino
  const handleDragEnter = useCallback((e, taskId) => {
    e.preventDefault();
    if (taskId !== draggedTaskId) {
      setDropTargetId(taskId);
    }
  }, [draggedTaskId]);
  
  // Manejar sobre zona de destino
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Manejar salida de zona de destino
  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);
  
  // Manejar fin de arrastre
  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDropTargetId(null);
    
    // Eliminar clase de estilo de arrastre
    const taskElements = document.querySelectorAll('[data-task-id]');
    taskElements.forEach(el => {
      el.classList.remove('opacity-50', 'border-t-2', 'border-primary');
    });
  }, []);
  
  // Manejar soltar
  const handleDrop = useCallback((e, targetTaskId) => {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId && targetTaskId && draggedId !== targetTaskId) {
      // Encontrar las posiciones actuales
      const draggedIndex = tasks.findIndex(t => t.id.toString() === draggedId.toString());
      const targetIndex = tasks.findIndex(t => t.id.toString() === targetTaskId.toString());
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Crear una copia del array de tareas
        const newTasks = [...tasks];
        
        // Eliminar la tarea arrastrada
        const [draggedTask] = newTasks.splice(draggedIndex, 1);
        
        // Insertar la tarea en la nueva posición
        newTasks.splice(targetIndex, 0, draggedTask);
        
        // Notificar al componente padre sobre el reordenamiento
        if (onTasksReorder) {
          onTasksReorder(newTasks);
        }
      }
    }
    
    // Limpiar estados
    handleDragEnd();
  }, [tasks, onTasksReorder, handleDragEnd]);
  
  // Renderizar loader si está cargando
  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Renderizar mensaje de error si hay error
  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }
  
  // Renderizar mensaje si no hay tareas
  if (!tasks.length) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-dark-text-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-md shadow-sm">
      {tasks.map((task) => (
        <div 
          key={task.id}
          onDragEnter={e => handleDragEnter(e, task.id)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, task.id)}
          className={`${dropTargetId === task.id ? 'border-t-2 border-primary' : ''}`}
        >
          <TaskItem 
            task={task}
            onComplete={onTaskComplete}
            onDelete={onTaskDelete}
            onEdit={onTaskEdit}
            onViewDetails={onTaskView}
            draggable={!!onTasksReorder}
            onDragStart={handleDragStart}
          />
        </div>
      ))}
    </div>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      priority: PropTypes.string,
      completed: PropTypes.bool,
      dueDate: PropTypes.string,
      category: PropTypes.string
    })
  ),
  onTaskComplete: PropTypes.func.isRequired,
  onTaskDelete: PropTypes.func.isRequired,
  onTaskEdit: PropTypes.func.isRequired,
  onTaskView: PropTypes.func.isRequired,
  onTasksReorder: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string
};

export default TaskList; 