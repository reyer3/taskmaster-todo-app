import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Componente de diagnóstico para depurar problemas de la aplicación
 * Muestra información relevante sobre el estado de la autenticación y configuración
 */
const Debug = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [apiUrl, setApiUrl] = useState('');
  const [token, setToken] = useState('');
  const [viteEnv, setViteEnv] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  // Recopilar información de diagnóstico
  useEffect(() => {
    // Verificar configuración de la API
    setApiUrl(import.meta.env.VITE_API_URL || 'No definida');
    
    // Verificar token
    setToken(localStorage.getItem('auth_token') || 'No hay token');
    
    // Recopilar variables de entorno de Vite
    const env = {};
    Object.keys(import.meta.env).forEach(key => {
      // No mostrar variables sensibles
      if (!key.includes('SECRET') && !key.includes('PASSWORD')) {
        env[key] = import.meta.env[key];
      }
    });
    setViteEnv(env);
    
    // Log de diagnóstico en consola
    console.group('Diagnóstico de la aplicación');
    console.log('Información de autenticación:', { isAuthenticated, isLoading, hasUser: !!user });
    console.log('API URL:', import.meta.env.VITE_API_URL);
    console.log('Token en localStorage:', localStorage.getItem('auth_token')?.substring(0, 15) + '...');
    console.log('Variables de entorno Vite:', env);
    console.groupEnd();
  }, [isAuthenticated, isLoading, user]);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button 
        onClick={toggleOpen}
        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        title="Diagnóstico"
      >
        <span className="text-xl">🔍</span>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-80 md:w-96 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg text-yellow-800 text-sm animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Diagnóstico</h2>
            <button 
              onClick={toggleOpen}
              className="text-yellow-700 hover:text-yellow-900"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            <div>
              <h3 className="font-semibold">Estado de Autenticación:</h3>
              <ul className="list-disc ml-6">
                <li>Autenticado: <span className="font-mono">{String(isAuthenticated)}</span></li>
                <li>Cargando: <span className="font-mono">{String(isLoading)}</span></li>
                <li>Usuario: <span className="font-mono">{user ? 'Presente' : 'No hay usuario'}</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold">Configuración:</h3>
              <ul className="list-disc ml-6">
                <li>API URL: <span className="font-mono text-xs break-all">{apiUrl}</span></li>
                <li>Token: <span className="font-mono text-xs">{token ? token.substring(0, 15) + '...' : 'No hay token'}</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debug;