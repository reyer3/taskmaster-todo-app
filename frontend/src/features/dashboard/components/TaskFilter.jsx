import React, { useState, useEffect, useRef } from 'react';
import useDebounce from '../../../hooks/useDebounce';

/**
 * Componente para la búsqueda y filtrado de tareas
 * Implementa debounce para evitar llamadas excesivas al servidor
 */
const TaskFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: '',
    priority: '',
    dateRange: 'all',
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Referencia para saber si es la primera renderización
  const isFirstRender = useRef(true);
  
  // Control adicional para evitar búsquedas automáticas
  const hasUserInteracted = useRef(false);
  
  // Aplicar debounce al término de búsqueda para evitar peticiones innecesarias
  // Requiere al menos 2 caracteres para iniciar la búsqueda
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 800, 2);
  
  // Detectar cambios en la búsqueda con debounce y aplicar los filtros
  useEffect(() => {
    // Evitar la búsqueda en la primera renderización
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Solo realizar búsqueda si ha habido interacción del usuario
    // o si el valor debounced ha cambiado explícitamente
    if (!hasUserInteracted.current && debouncedSearchQuery === '') {
      return;
    }
    
    // Solo aplicar filtros si hay un término de búsqueda válido o está completamente vacío
    if ((debouncedSearchQuery && debouncedSearchQuery.length >= 2) || debouncedSearchQuery === '') {
      if (onFilterChange) {
        onFilterChange({
          ...filters,
          searchQuery: debouncedSearchQuery
        });
      }
    }
  }, [debouncedSearchQuery]); // Eliminamos filters de las dependencias para evitar ciclos
  
  // Aplicar otros filtros (no el de búsqueda) cuando cambian
  useEffect(() => {
    if (isFirstRender.current) return;
    
    // Marcar que hubo interacción del usuario al cambiar filtros
    hasUserInteracted.current = true;
    
    // Evitar aplicar la búsqueda aquí, ya que se maneja en el otro useEffect
    const { searchQuery, ...otherFilters } = filters;
    onFilterChange({
      ...otherFilters,
      searchQuery: debouncedSearchQuery // Usar el valor con debounce
    });
  }, [filters.status, filters.priority, filters.dateRange]);
  
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
    
    // Marcar que hubo interacción del usuario
    hasUserInteracted.current = true;
    
    // Al enviar el formulario, aplicar los filtros inmediatamente si hay texto
    if (filters.searchQuery.trim().length > 0 && onFilterChange) {
      onFilterChange(filters);
    }
  };
  
  const clearFilters = () => {
    // Marcar que hubo interacción del usuario
    hasUserInteracted.current = true;
    
    const resetFilters = {
      searchQuery: '',
      status: '',
      priority: '',
      dateRange: 'all'
    };
    setFilters(resetFilters);
    
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Buscar y Filtrar
      </h2>
      
      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            name="searchQuery"
            placeholder="Buscar tareas..."
            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={filters.searchQuery}
            onChange={handleFilterChange}
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark transition-colors"
            disabled={filters.searchQuery.trim().length < 2}
          >
            Buscar
          </button>
        </div>
        {filters.searchQuery && filters.searchQuery.trim().length < 2 ? (
          <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
            Escribe al menos 2 caracteres para buscar
          </p>
        ) : filters.searchQuery && debouncedSearchQuery !== filters.searchQuery && (
          <p className="text-xs text-gray-500 mt-1 animate-pulse">Buscando...</p>
        )}
      </form>
      
      {/* Botón para mostrar/ocultar filtros avanzados */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-primary hover:underline text-sm focus:outline-none"
        >
          {showAdvancedFilters ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
        </button>
        
        {filters.status || filters.priority || filters.dateRange !== 'all' || filters.searchQuery ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-red-500 hover:underline text-sm focus:outline-none"
          >
            Limpiar filtros
          </button>
        ) : null}
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
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