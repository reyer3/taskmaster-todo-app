import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente de pie de página de la aplicación
 * Contiene enlaces de navegación secundaria y copyright
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sección de producto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">TaskMaster</h3>
            <p className="text-gray-400 text-sm">
              Simplifica la gestión de tus tareas y proyectos con nuestra 
              solución integral de gestión de tareas.
            </p>
          </div>
          
          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-md font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/features" className="hover:text-white transition-colors">
                  Características
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Precios
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Soporte */}
          <div>
            <h4 className="text-md font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/documentation" className="hover:text-white transition-colors">
                  Documentación
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-md font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Línea divisoria */}
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} TaskMaster. Todos los derechos reservados.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 