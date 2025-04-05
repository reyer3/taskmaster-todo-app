import React, { useState, useEffect, useRef } from 'react';
import useDebounce from '../../../hooks/useDebounce';

/**
 * Componente para la búsqueda y filtrado de tareas
 * Implementa debounce para evitar llamadas excesivas al servidor
 */
const TaskFilter = ({ onFilterChange, disabled = false }) => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: '',
    priority: '',
    dateRange: 'all',
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeSearch, setActiveSearch] = useState(false);
  
  // Referencia para saber si es la primera renderización
  const isFirstRender = useRef(true);
  
  // Control adicional para evitar búsquedas automáticas
  const hasUserInteracted = useRef(false);
  
  // Aplicar debounce al término de búsqueda para evitar peticiones innecesarias
  // Requiere al menos 2 caracteres para iniciar la búsqueda
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 800, 2);
  
  // Detectar cambios en la búsqueda con debounce y aplicar los filtros
  useEffect(() => {
    // No hacer nada si el componente está deshabilitado o no hay función de cambio
    if (disabled || !onFilterChange) {
      return;
    }
    
    // Evitar la búsqueda en la primera renderización
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Solo realizar búsqueda si ha habido interacción del usuario
    if (!hasUserInteracted.current) {
      return;
    }
    
    // Solo aplicar filtros si hay un término de búsqueda válido o está completamente vacío
    if ((debouncedSearchQuery && debouncedSearchQuery.length >= 2) || debouncedSearchQuery === '') {
      // Activar indicador visual de búsqueda activa
      if (debouncedSearchQuery || filters.status || filters.priority || filters.dateRange !== 'all') {
        setActiveSearch(true);
      } else {
        setActiveSearch(false);
      }
      
      onFilterChange({
        ...filters,
        searchQuery: debouncedSearchQuery
      });
    }
  }, [debouncedSearchQuery, disabled, onFilterChange, filters]); 
  
  // Aplicar otros filtros (no el de búsqueda) cuando cambian
  useEffect(() => {
    // No hacer nada si el componente está deshabilitado o no hay función de cambio
    if (disabled || !onFilterChange) {
      return;
    }
    
    // Evitar la búsqueda en la primera renderización
    if (isFirstRender.current) {
      return;
    }
    
    // Solo realizar cambios si ha habido interacción del usuario
    if (!hasUserInteracted.current) {
      return;
    }
    
    // Evitar aplicar la búsqueda aquí, ya que se maneja en el otro useEffect
    const { searchQuery, ...otherFilters } = filters;
    onFilterChange({
      ...otherFilters,
      searchQuery: debouncedSearchQuery // Usar el valor con debounce
    });
    
    // Activar indicador visual de búsqueda activa
    if (filters.status || filters.priority || filters.dateRange !== 'all' || debouncedSearchQuery) {
      setActiveSearch(true);
    } else {
      setActiveSearch(false);
    }
  }, [filters.status, filters.priority, filters.dateRange, disabled, onFilterChange, debouncedSearchQuery]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Marcar que hubo interacción del usuario
    hasUserInteracted.current = true;
    
    // Si es la búsqueda, solo actualizamos el estado local
    if (name === 'searchQuery') {
      setFilters(prev => ({ ...prev, [name]: value }));
      return;
    }
    
    // Para otros filtros, actualizamos el estado
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // No hacer nada si el componente está deshabilitado o no hay función de cambio
    if (disabled || !onFilterChange) {
      return;
    }
    
    // Marcar que hubo interacción del usuario
    hasUserInteracted.current = true;
    
    // Al enviar el formulario, aplicar los filtros inmediatamente si hay texto
    if (filters.searchQuery.trim().length > 0) {
      setActiveSearch(true);
      onFilterChange(filters);
    }
  };
  
  const clearFilters = () => {
    // No hacer nada si el componente está deshabilitado o no hay función de cambio
    if (disabled || !onFilterChange) {
      return;
    }
    
    // Marcar que hubo interacción del usuario
    hasUserInteracted.current = true;
    
    const resetFilters = {
      searchQuery: '',
      status: '',
      priority: '',
      dateRange: 'all'
    };
    setFilters(resetFilters);
    setActiveSearch(false);
    
    onFilterChange(resetFilters);
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${disabled ? 'opacity-75' : ''} ${activeSearch ? 'border-l-4 border-primary' : ''}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
        <span>Buscar y Filtrar</span>
        {activeSearch && (
          <span className="ml-2 px-2 py-1 bg-primary-light text-primary text-xs rounded-md">
            Búsqueda activa
          </span>
        )}
      </h2>
      
      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            name="searchQuery"
            placeholder="Buscar tareas..."
            className={`flex-grow px-4 py-2 border ${activeSearch ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} rounded-l-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white`}
            value={filters.searchQuery}
            onChange={handleFilterChange}
            autoComplete="off"
            disabled={disabled}
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled || filters.searchQuery.trim().length < 2}
          >
            Buscar
          </button>
        </div>
        {filters.searchQuery && filters.searchQuery.trim().length < 2 ? (
          <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
            Escribe al menos 2 caracteres para buscar
          </p>
        ) : filters.searchQuery && debouncedSearchQuery !== filters.searchQuery && !disabled && (
          <p className="text-xs text-gray-500 mt-1 animate-pulse">Buscando...</p>
        )}
        
        {disabled && (
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            Cargando datos iniciales...
          </p>
        )}
        
        {activeSearch && (
          <div className="mt-2 text-xs text-primary-dark">
            <p>
              {Object.entries(filters).filter(([key, value]) => 
                (key === 'searchQuery' && value) || 
                (key !== 'searchQuery' && value && value !== 'all')).length > 0 
                ? 'Filtros aplicados: ' 
                : ''}
              {filters.searchQuery && <span className="mr-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Texto: "{filters.searchQuery}"</span>}
              {filters.status && <span className="mr-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Estado: {filters.status}</span>}
              {filters.priority && <span className="mr-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Prioridad: {filters.priority}</span>}
              {filters.dateRange !== 'all' && <span className="mr-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Fecha: {filters.dateRange}</span>}
            </p>
          </div>
        )}
      </form>
      
      {/* Botón para mostrar/ocultar filtros avanzados */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-primary hover:underline text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          {showAdvancedFilters ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
        </button>
        
        {(filters.status || filters.priority || filters.dateRange !== 'all' || filters.searchQuery) && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-red-500 hover:underline text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      
      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={`w-full px-3 py-2 border ${filters.status ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white`}
              disabled={disabled}
            >
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="inProgress">En progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          
          {/* Filtro por prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prioridad
            </label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className={`w-full px-3 py-2 border ${filters.priority ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white`}
              disabled={disabled}
            >
              <option value="">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          
          {/* Filtro por rango de fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha
            </label>
            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className={`w-full px-3 py-2 border ${filters.dateRange !== 'all' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white`}
              disabled={disabled}
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="overdue">Vencidas</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilter; 