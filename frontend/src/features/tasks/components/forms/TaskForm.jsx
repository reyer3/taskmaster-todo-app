import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

// Mapeo de prioridades para mostrar en español pero enviar en inglés al API
const PRIORITY_MAP = {
  'high': 'Alta',
  'medium': 'Media',
  'low': 'Baja',
  'none': 'Sin prioridad'
};

// Mapeo inverso para convertir de español a inglés
const PRIORITY_MAP_REVERSE = {
  'Alta': 'high',
  'Media': 'medium',
  'Baja': 'low',
  'Sin prioridad': 'none'
};

/**
 * Formulario para crear o editar tareas
 */
const TaskForm = ({
  task = null,
  onSubmit,
  onCancel,
  categories = ['personal', 'trabajo', 'estudio'],
  priorities = ['high', 'medium', 'low', 'none'],
  loading = false
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'none',
    dueDate: '',
    tags: '',
    completed: false
  });
  
  // Estado para errores de validación
  const [errors, setErrors] = useState({});
  
  // Actualizar el formulario si se proporciona una tarea para editar
  useEffect(() => {
    if (task) {
      const formattedTask = {
        ...task,
        // Formatear la fecha si existe
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        // Convertir el array de tags a string si existe
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : ''
      };
      
      setFormData(formattedTask);
    }
  }, [task]);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // Limpiar error del campo cuando cambia
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validar el formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Validar título
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (formData.title.length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    } else if (formData.title.length > 100) {
      newErrors.title = 'El título no puede exceder los 100 caracteres';
    }
    
    // Validar descripción si existe
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder los 500 caracteres';
    }
    
    // Validar fecha de vencimiento
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      if (isNaN(dueDate.getTime())) {
        newErrors.dueDate = 'Fecha de vencimiento inválida';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Procesar datos del formulario
      const processedData = {
        ...formData,
        // Convertir tags de string a array
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      };
      
      // Ajustar la fecha de vencimiento si es la fecha actual
      if (formData.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Inicio del día actual
        
        const selectedDate = new Date(formData.dueDate);
        selectedDate.setHours(0, 0, 0, 0); // Inicio del día seleccionado
        
        // Si la fecha seleccionada es hoy, ajustar al final del día
        if (selectedDate.getTime() === today.getTime()) {
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999); // Final del día
          processedData.dueDate = endOfDay.toISOString();
        }
      }
      
      // Mantener ID solo si estamos editando
      if (task?.id) {
        processedData.id = task.id;
      }
      
      onSubmit(processedData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
        >
          Título <span className="text-red-500">*</span>
        </label>
        <input 
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`block w-full border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary`}
          placeholder="Nombre de la tarea"
          disabled={loading}
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      
      {/* Descripción */}
      <div>
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
        >
          Descripción
        </label>
        <textarea 
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className={`block w-full border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary`}
          placeholder="Describe la tarea con más detalle"
          disabled={loading}
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {/* Categoría */}
        <div>
          <label 
            htmlFor="category" 
            className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
          >
            Categoría
          </label>
          <select 
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="block w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary"
            disabled={loading}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Prioridad */}
        <div>
          <label 
            htmlFor="priority" 
            className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
          >
            Prioridad
          </label>
          <select 
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="block w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary"
            disabled={loading}
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {PRIORITY_MAP[priority]}
              </option>
            ))}
          </select>
        </div>
      
        {/* Fecha de vencimiento */}
        <div>
          <label 
            htmlFor="dueDate" 
            className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
          >
            Fecha de vencimiento
          </label>
          <input 
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className={`block w-full border ${errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary`}
            disabled={loading}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
        </div>
        
        {/* Etiquetas */}
        <div>
          <label 
            htmlFor="tags" 
            className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1"
          >
            Etiquetas (separadas por coma)
          </label>
          <input 
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="block w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary"
            placeholder="ej: personal, trabajo, urgente"
            disabled={loading}
          />
        </div>
      </div>
      
      {/* Estado completado */}
      <div className="flex items-center my-2">
        <input 
          type="checkbox"
          id="completed"
          name="completed"
          checked={formData.completed}
          onChange={handleChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-dark-border rounded"
          disabled={loading}
        />
        <label 
          htmlFor="completed" 
          className="ml-2 block text-sm text-gray-700 dark:text-dark-text-secondary"
        >
          Marcar como completada
        </label>
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
              {task ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            task ? 'Actualizar tarea' : 'Crear tarea'
          )}
        </button>
      </div>
    </form>
  );
};

TaskForm.propTypes = {
  task: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string),
  priorities: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool
};

export default TaskForm; 