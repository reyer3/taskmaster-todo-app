import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../context/LayoutContext';

/**
 * Guarda el estado del sidebar en localStorage
 * @param {boolean} collapsed Estado colapsado
 */
const saveSidebarState = (collapsed) => {
  localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
};

/**
 * Recupera el estado del sidebar de localStorage
 * @returns {boolean} Estado colapsado
 */
const getSavedSidebarState = () => {
  const saved = localStorage.getItem('sidebar_collapsed');
  return saved ? JSON.parse(saved) : false;
};

/**
 * Componente de barra lateral con navegación principal
 * Incluye enlaces a las secciones principales y accesos rápidos
 */
const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const { isPublicRoute } = useLayout();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(getSavedSidebarState());
  const [mobileOpen, setMobileOpen] = useState(false);

  // Efecto para guardar el estado cuando cambia
  useEffect(() => {
    saveSidebarState(collapsed);
  }, [collapsed]);

  // Cierra la navegación móvil cuando cambia la ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Si no está autenticado, no mostramos el sidebar
  if (!isAuthenticated || isPublicRoute) return null;

  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  const toggleMobileOpen = () => {
    setMobileOpen(prev => !prev);
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/tasks', label: 'Tareas', icon: '✓' },
    { to: '/calendar', label: 'Calendario', icon: '📅' },
    { to: '/reports', label: 'Reportes', icon: '📈' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay para cerrar sidebar en móvil */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden animate-fade-in"
          onClick={toggleMobileOpen}
        />
      )}
      
      {/* Botón para abrir sidebar en móvil */}
      <button
        className="fixed bottom-4 left-4 z-50 lg:hidden bg-primary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
        onClick={toggleMobileOpen}
        aria-label="Abrir menú lateral"
      >
        <span className="text-xl">≡</span>
      </button>
      
      <aside 
        className={`bg-white dark:bg-dark-bg-secondary text-gray-800 dark:text-dark-text-primary fixed left-0 top-0 h-screen pt-20 transition-all duration-300 shadow-md z-40 border-r border-gray-200 dark:border-dark-border
          ${collapsed ? 'w-20' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full flex flex-col">
          <button 
            onClick={toggleCollapsed} 
            className="absolute top-24 -right-3 bg-white dark:bg-dark-bg-tertiary w-6 h-6 rounded-full shadow-md flex items-center justify-center text-primary border border-gray-200 dark:border-dark-border hidden lg:flex"
            aria-label={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? '→' : '←'}
          </button>
          
          <div className="px-4 py-2 flex-1">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center p-3 rounded-md transition-all duration-200 text-gray-700 ${
                    isActive(item.to)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md mr-3 text-xl">
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          
            {!collapsed && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-3">Acciones rápidas</h3>
                <div className="space-y-1">
                  <button className="w-full text-left p-3 text-sm hover:bg-gray-100 rounded-md text-gray-700 flex items-center">
                    <span className="mr-3">➕</span>
                    <span>Crear tarea</span>
                  </button>
                  <button className="w-full text-left p-3 text-sm hover:bg-gray-100 rounded-md text-gray-700 flex items-center">
                    <span className="mr-3">🕒</span>
                    <span>Reunión rápida</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 text-xs text-gray-500 mt-auto">
            {!collapsed && "TaskMaster © 2023"}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 