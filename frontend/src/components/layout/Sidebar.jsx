import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Componente de barra lateral con navegación principal
 * Incluye enlaces a las secciones principales y accesos rápidos
 */
const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Si no está autenticado, no mostramos el sidebar
  if (!isAuthenticated) return null;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/tasks', label: 'Tareas', icon: '✓' },
    { to: '/calendar', label: 'Calendario', icon: '📅' },
    { to: '/reports', label: 'Reportes', icon: '📈' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      className={`bg-gray-50 text-gray-800 h-screen fixed left-0 top-0 pt-16 transition-all duration-300 shadow-md ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="px-4 py-2 flex flex-col h-full">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="self-end mb-6 text-gray-500 hover:text-primary"
        >
          {collapsed ? '→' : '←'}
        </button>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive(item.to)
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {!collapsed && (
          <div className="mt-auto pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold mb-2">Accesos rápidos</h3>
            <div className="space-y-1 text-sm">
              <button className="w-full text-left p-2 hover:bg-gray-200 rounded-md">
                Crear tarea
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-200 rounded-md">
                Reunión rápida
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 