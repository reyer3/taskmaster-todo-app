import React, { createContext, useContext } from 'react';

// Contexto para configuración de layout
export const LayoutContext = createContext({
  isAuthenticated: false,
  isPublicRoute: false
});

/**
 * Hook para usar el contexto del layout
 */
export const useLayout = () => useContext(LayoutContext); 