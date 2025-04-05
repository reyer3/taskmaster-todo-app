import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import useTheme from '../../../../hooks/useTheme';

// Registrar el idioma español
registerLocale('es', es);

// Nombres de los meses en español
const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Generar años desde el actual hasta 10 años en el futuro
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

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

    // Cerrar manualmente el calendario cuando se selecciona una fecha
    if (date) {
      // Dar tiempo para que el usuario vea la fecha seleccionada 
      // antes de cerrar el calendario
      setTimeout(() => {
        // Cerrar el calendario manualmente simulando un clic fuera
        const datePickerInput = document.getElementById('dueDate');
        if (datePickerInput) {
          datePickerInput.blur();
          
          // Ocultar DatePicker manualmente
          const datepickerContainer = document.querySelector('.react-datepicker-popper');
          if (datepickerContainer) {
            datepickerContainer.style.display = 'none';
          }
          
          // También eliminar overlay manualmente
          const overlay = document.querySelector('.calendar-overlay');
          if (overlay) {
            overlay.style.opacity = "0";
            setTimeout(() => {
              if (overlay.parentNode) {
                document.body.removeChild(overlay);
              }
            }, 200);
          }
        }
        
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
      }, 300); // Retraso suficiente para ver la fecha seleccionada
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
  
  // Función para manejar eventos de teclado para accesibilidad del calendario
  const handleCalendarKeyDown = (e) => {
    // Escapar cierra el calendario
    if (e.key === 'Escape') {
      const input = document.getElementById('dueDate');
      if (input) {
        input.click(); // Simular clic para cerrar el datepicker
      }
      e.preventDefault();
    }
    
    // Enter selecciona la fecha actual marcada
    if (e.key === 'Enter') {
      const selectedDay = document.querySelector('.react-datepicker__day--selected');
      if (selectedDay) {
        selectedDay.click();
        
        // Dar tiempo para ver la selección y luego cerrar
        setTimeout(() => {
          const input = document.getElementById('dueDate');
          if (input) {
            input.click(); // Simular clic para cerrar el datepicker
          }
        }, 300);
      }
      e.preventDefault();
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
          <div className={`${errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'} border rounded-md focus-within:ring-2 focus-within:ring-primary relative`}>
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
              closeOnSelect={false}
              shouldCloseOnSelect={false}
              onClickOutside={(event) => {
                // Cerrar el calendario si se hace clic en el overlay (fondo oscuro)
                if (event.target.classList.contains('calendar-centered') || 
                    event.target.classList.contains('calendar-overlay')) {
                  const input = document.getElementById('dueDate');
                  if (input) {
                    input.click(); // Simular clic para cerrar el datepicker
                  }
                  // Eliminar overlay inmediatamente al hacer clic fuera
                  const overlay = document.querySelector('.calendar-overlay');
                  if (overlay) {
                    overlay.style.opacity = "0";
                    setTimeout(() => {
                      if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                      }
                    }, 200);
                  }
                }
              }}
              onCalendarOpen={() => {
                // Limpiar cualquier overlay anterior por si acaso
                const existingOverlay = document.querySelector('.calendar-overlay');
                if (existingOverlay && existingOverlay.parentNode) {
                  document.body.removeChild(existingOverlay);
                }
                
                // Crear overlay para poder cerrar al hacer clic en el fondo
                const overlay = document.createElement('div');
                overlay.className = 'calendar-overlay';
                document.body.appendChild(overlay);
                
                // Forzar posicionamiento inteligente del calendario en el centro de la pantalla
                setTimeout(() => {
                  const calendar = document.querySelector('.react-datepicker');
                  const popperElement = document.querySelector('.react-datepicker-popper');
                  
                  if (calendar && popperElement) {
                    // Centrar el calendario en la pantalla
                    calendar.style.zIndex = "9999";
                    popperElement.style.position = "fixed";
                    popperElement.style.top = "50%";
                    popperElement.style.left = "50%";
                    popperElement.style.transform = "translate(-50%, -50%)";
                    
                    // Añadir clase para efecto modal
                    popperElement.classList.add('calendar-centered');
                    
                    // Asegurarse que el contenido completo del calendario es visible
                    const viewportHeight = window.innerHeight;
                    const calendarHeight = calendar.offsetHeight;
                    
                    // Si el calendario es demasiado grande para la pantalla, reducir su tamaño
                    if (calendarHeight > viewportHeight * 0.8) {
                      calendar.style.maxHeight = `${viewportHeight * 0.8}px`;
                      calendar.style.overflow = "hidden";
                    }
                    
                    // Añadir botón "Seleccionar" personalizado
                    const footerButtons = document.createElement('div');
                    footerButtons.className = 'calendar-footer-buttons';
                    
                    const selectButton = document.createElement('button');
                    selectButton.textContent = 'Seleccionar';
                    selectButton.className = 'calendar-select-button';
                    selectButton.setAttribute('aria-label', 'Confirmar selección de fecha');
                    selectButton.onclick = () => {
                      const input = document.getElementById('dueDate');
                      if (input) {
                        input.click(); // Simular clic para cerrar el datepicker
                      }
                    };
                    
                    const cancelButton = document.createElement('button');
                    cancelButton.textContent = 'Cancelar';
                    cancelButton.className = 'calendar-cancel-button';
                    cancelButton.setAttribute('aria-label', 'Cancelar selección de fecha');
                    cancelButton.onclick = () => {
                      const input = document.getElementById('dueDate');
                      if (input) {
                        // Restaurar la fecha original antes de cerrar
                        setFormData({
                          ...formData,
                          dueDate: formData.dueDate
                        });
                        input.click(); // Simular clic para cerrar el datepicker
                      }
                    };
                    
                    footerButtons.appendChild(cancelButton);
                    footerButtons.appendChild(selectButton);
                    
                    // Si ya existe un today-button, colocarlo después
                    const todayButton = calendar.querySelector('.react-datepicker__today-button');
                    if (todayButton) {
                      todayButton.after(footerButtons);
                    } else {
                      calendar.appendChild(footerButtons);
                    }
                    
                    // Mejorar accesibilidad
                    calendar.setAttribute('role', 'dialog');
                    calendar.setAttribute('aria-modal', 'true');
                    calendar.setAttribute('aria-labelledby', 'calendar-header');
                    
                    // Agregar manejo de teclas para accesibilidad
                    document.addEventListener('keydown', handleCalendarKeyDown);
                  }
                }, 10);
              }}
              onCalendarClose={() => {
                // Eliminar overlay cuando se cierra el calendario con una animación suave
                const overlay = document.querySelector('.calendar-overlay');
                if (overlay) {
                  overlay.style.opacity = "0";
                  setTimeout(() => {
                    if (overlay.parentNode) {
                      document.body.removeChild(overlay);
                    }
                  }, 200);
                }
                
                // Remover event listeners cuando se cierra
                document.removeEventListener('keydown', handleCalendarKeyDown);
              }}
              popperModifiers={[
                {
                  name: "flip",
                  options: {
                    fallbackPlacements: ['center'],
                  },
                },
                {
                  name: "offset",
                  options: {
                    offset: [0, 0], // Sin offset para centrado perfecto
                  },
                },
                {
                  name: "preventOverflow",
                  options: {
                    boundary: "viewport",
                    padding: 20,
                  },
                },
                {
                  name: "computeStyles",
                  options: {
                    gpuAcceleration: false,
                  },
                },
                {
                  name: "arrow",
                  options: {
                    element: false, // Deshabilitar flecha para mejor centrado
                  },
                },
              ]}
              disabled={loading}
              className="w-full px-3 py-1.5 focus:outline-none text-gray-900 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary"
              calendarClassName="shadow-xl border-0 text-base calendar-compact calendar-float calendar-modal calendar-accessible"
              popperClassName="datepicker-popper-float"
              fixedHeight
              dayClassName={date => 
                date.getDay() === 0 || date.getDay() === 6 
                  ? 'weekend-day' 
                  : undefined
              }
              renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled
              }) => (
                <div className="datepicker-custom-header" id="calendar-header">
                  <button
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    type="button"
                    className="react-datepicker__navigation-button"
                    aria-label="Mes anterior"
                  >
                    ←
                  </button>
                  <div className="datepicker-selects">
                    <select
                      className="datepicker-dropdown"
                      value={date.getMonth()}
                      onChange={({ target: { value } }) => changeMonth(value)}
                      aria-label="Seleccionar mes"
                    >
                      {months.map((option, i) => (
                        <option key={option} value={i}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="datepicker-dropdown"
                      value={date.getFullYear()}
                      onChange={({ target: { value } }) => changeYear(value)}
                      aria-label="Seleccionar año"
                    >
                      {years.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    type="button"
                    className="react-datepicker__navigation-button"
                    aria-label="Siguiente mes"
                  >
                    →
                  </button>
                </div>
              )}
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