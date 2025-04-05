import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Componente de pie de página de la aplicación
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Determinar si está en una ruta autenticada donde se muestra el sidebar
  const isAuthRoute = isAuthenticated && 
    !(location.pathname === '/login' || location.pathname === '/register');
  
  return (
    <footer className={`bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border w-full transition-colors duration-300 ${isAuthRoute ? 'lg:ml-64' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">TaskMaster</span>
            </Link>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Simplifica la gestión de tus tareas y proyectos con nuestra solución integral.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-4">
              Enlaces rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Características
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Precios
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-4">
              Soporte
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Documentación
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-dark-text-primary uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-dark-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm">
            &copy; {currentYear} TaskMaster. Todos los derechos reservados.
          </p>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
              </svg>
            </a>
            
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
            Diseñado con <span className="text-red-500">❤</span> para maximizar tu productividad
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 