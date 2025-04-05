import React, { useState } from 'react';
import { useToast } from '../../../context/ToastContext';

/**
 * Página principal de gestión de tareas
 */
const TasksPage = () => {
  // Estado para tareas simuladas (después se conectarán con la API)
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Completar diseño de UI', completed: false, priority: 'alta' },
    { id: 2, title: 'Implementar autenticación', completed: true, priority: 'alta' },
    { id: 3, title: 'Crear componentes base', completed: false, priority: 'media' },
    { id: 4, title: 'Configurar rutas', completed: true, priority: 'media' },
    { id: 5, title: 'Escribir tests unitarios', completed: false, priority: 'baja' },
  ]);
  
  const { success } = useToast();
  
  // Función para toggle de completado
  const toggleComplete = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, completed: !task.completed } 
        : task
    ));
    
    const task = tasks.find(t => t.id === id);
    success(`Tarea "${task.title}" ${!task.completed ? 'completada' : 'marcada como pendiente'}`);
  };
  
  // Simulación de función para eliminar tarea
  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(tasks.filter(task => task.id !== id));
    success(`Tarea "${taskToDelete.title}" eliminada`);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Tareas</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
          Nueva Tarea
        </button>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select 
              id="status"
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todas</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select 
              id="priority"
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input 
              type="text"
              id="search"
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Buscar tareas..."
            />
          </div>
        </div>
      </div>
      
      {/* Lista de tareas */}
      <div className="bg-white rounded-md shadow-sm">
        <ul className="divide-y divide-gray-200">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <li key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className={`ml-3 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </span>
                  <span className={`ml-3 text-xs px-2 py-1 rounded-full ${
                    task.priority === 'alta' 
                      ? 'bg-red-100 text-red-800' 
                      : task.priority === 'media'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-primary hover:text-primary-dark">
                    Editar
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-800"
                    onClick={() => deleteTask(task.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">
              No hay tareas para mostrar
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TasksPage; 