import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

// Registrar el idioma español
registerLocale('es', es);

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
        dueDate: task.dueDate ? new Date(task.dueDate) : '',
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
  
  // Manejar cambio de fecha
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
    
    // Limpiar error del campo cuando cambia
    if (errors.dueDate) {
      setErrors(prev => ({
        ...prev,
        dueDate: null
      }));
    }

    // Si se seleccionó una fecha, hacer scroll al siguiente campo
    if (date) {
      setTimeout(() => {
        // Intentar enfocar el siguiente campo (etiquetas)
        const tagsField = document.getElementById('tags');
        if (tagsField) {
          // Solo hacer scroll, no enfocar para evitar que se abra el teclado en móviles
          const rect = tagsField.getBoundingClientRect();
          if (rect.top > window.innerHeight * 0.7) {
            window.scrollTo({
              top: window.scrollY + (rect.top - window.innerHeight * 0.5),
              behavior: 'smooth'
            });
          }
        }
      }, 50);
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
      if (!(formData.dueDate instanceof Date) || isNaN(formData.dueDate.getTime())) {
        newErrors.dueDate = 'Fecha de vencimiento inválida';
      }
      
      // Verificar que la fecha no sea en el pasado
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(formData.dueDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'La fecha de vencimiento no puede ser en el pasado';
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
        } else {
          // Asegurar que todas las fechas se envíen en formato ISO
          processedData.dueDate = formData.dueDate.toISOString();
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
          <div className={`${errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} border rounded-md overflow-visible focus-within:ring-2 focus-within:ring-primary relative`}>
            <DatePicker
              id="dueDate"
              selected={formData.dueDate}
              onChange={handleDateChange}
              locale="es"
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecciona una fecha"
              minDate={new Date()}
              showMonthDropdown
              showYearDropdown
              yearDropdownItemNumber={10}
              scrollableYearDropdown
              dropdownMode="select"
              todayButton="Hoy"
              popperPlacement="auto"
              autoComplete="off"
              onCalendarOpen={() => {
                // Forzar posicionamiento inteligente del calendario
                setTimeout(() => {
                  const input = document.getElementById('dueDate');
                  const calendar = document.querySelector('.react-datepicker');
                  if (input && calendar) {
                    const inputRect = input.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - inputRect.bottom;
                    const spaceAbove = inputRect.top;
                    
                    // Si hay poco espacio abajo, posicionar arriba
                    if (spaceBelow < 300 && spaceAbove > 300) {
                      // Scroll para ver bien el calendario si se abre hacia arriba
                      window.scrollTo({
                        top: window.scrollY - 100,
                        behavior: 'smooth'
                      });
                    } else {
                      // Scroll para ver bien el calendario si está abajo
                      const calendarRect = calendar.getBoundingClientRect();
                      if (calendarRect.bottom > window.innerHeight) {
                        window.scrollTo({
                          top: window.scrollY + 100,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }
                }, 10);
              }}
              popperModifiers={[
                {
                  name: "flip",
                  options: {
                    fallbackPlacements: ['top-start', 'bottom-start', 'top-end', 'bottom-end'],
                  },
                },
                {
                  name: "offset",
                  options: {
                    offset: [0, 5],
                  },
                },
                {
                  name: "preventOverflow",
                  options: {
                    rootBoundary: "viewport",
                    padding: 8,
                  },
                },
              ]}
              shouldCloseOnSelect={true}
              disabled={loading}
              className="w-full px-3 py-1.5 focus:outline-none text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary"
              calendarClassName="shadow-xl border-0 text-base calendar-compact"
              fixedHeight
              renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="datepicker-custom-header">
                  <button 
                    className="flex items-center justify-center" 
                    onClick={decreaseMonth} 
                    disabled={prevMonthButtonDisabled}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="flex space-x-1">
                    <select
                      value={date.getMonth()}
                      onChange={({ target: { value } }) => changeMonth(Number(value))}
                      className="datepicker-dropdown"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(date.getFullYear(), i).toLocaleString('es', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={date.getFullYear()}
                      onChange={({ target: { value } }) => changeYear(Number(value))}
                      className="datepicker-dropdown"
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={i} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <button 
                    className="flex items-center justify-center" 
                    onClick={increaseMonth} 
                    disabled={nextMonthButtonDisabled}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              dayClassName={date => 
                date.getDate() === new Date().getDate() && 
                date.getMonth() === new Date().getMonth() && 
                date.getFullYear() === new Date().getFullYear() 
                  ? "datepicker-today" 
                  : undefined
              }
            />
            {formData.dueDate && (
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => handleDateChange(null)}
                aria-label="Borrar fecha"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
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