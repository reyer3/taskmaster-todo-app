import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Página de error 404 para rutas no encontradas
 */
const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <div className="w-24 h-1 bg-accent my-6" />
      <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFoundPage; 