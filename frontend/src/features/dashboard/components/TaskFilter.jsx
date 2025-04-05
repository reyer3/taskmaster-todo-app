import React, { useState } from 'react';

/**
 * Componente para la búsqueda y filtrado de tareas
 */
const TaskFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: '',
    priority: '',
    dateRange: 'all',
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };
  
  const clearFilters = () => {
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
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark transition-colors"
          >
            Buscar
          </button>
        </div>
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
        
        {filters.status || filters.priority || filters.dateRange !== 'all' ? (
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