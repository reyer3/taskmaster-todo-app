import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';

/**
 * Componente de layout principal que organiza la estructura de la aplicación
 * Integra Header, Sidebar, contenido principal (Outlet) y Footer
 */
const Layout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <div className="flex flex-1">
        {isAuthenticated && <Sidebar />}
        
        <main 
          className={`flex-1 transition-all duration-300 ${
            isAuthenticated ? 'ml-64' : ''
          }`}
        >
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout; 