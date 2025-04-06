import React from 'react';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from './common/ThemeToggle';

/**
 * Componente de demostración para el modo oscuro
 * Muestra diferentes elementos UI con soporte para temas
 */
const DarkModeDemo = () => {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';

  return (
    <div className="space-y-8 py-8">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Demo de Tema Oscuro</h1>
        <ThemeToggle />
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Estado Actual del Tema</h2>
        </div>
        <div className="card-content">
          <p className="mb-4">
            Modo actual: <span className="font-semibold">{darkMode ? 'Oscuro' : 'Claro'}</span>
          </p>
          <p>
            Utiliza el botón de cambio de tema en la esquina superior derecha para alternar entre modos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3>Botones</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary">Primario</button>
              <button className="btn btn-secondary">Secundario</button>
              <button className="btn btn-accent">Acento</button>
              <button className="btn btn-danger">Peligro</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Formularios</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="form-control">
              <label htmlFor="demo-text" className="form-label">Campo de texto</label>
              <input id="demo-text" type="text" className="form-input" placeholder="Escribe algo..." />
            </div>
            <div className="form-control">
              <label htmlFor="demo-select" className="form-label">Selector</label>
              <select id="demo-select" className="form-input">
                <option value="">Selecciona una opción</option>
                <option value="1">Opción 1</option>
                <option value="2">Opción 2</option>
                <option value="3">Opción 3</option>
              </select>
            </div>
            <div className="form-control">
              <label htmlFor="demo-textarea" className="form-label">Área de texto</label>
              <textarea id="demo-textarea" className="form-input" rows="3" placeholder="Escribe algo más largo..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Tipografía</h3>
        </div>
        <div className="card-content space-y-4">
          <h1>Encabezado 1</h1>
          <h2>Encabezado 2</h2>
          <h3>Encabezado 3</h3>
          <h4>Encabezado 4</h4>
          <p className="text-lg">Párrafo grande con <a href="#" className="text-primary dark:text-primary-light">enlace de ejemplo</a> para probar.</p>
          <p>Párrafo normal con texto de tamaño estándar para mostrar cómo se ve el texto regular en ambos modos.</p>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Texto más pequeño con color secundario para información menos importante.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Tarjetas y Bordes</h3>
        </div>
        <div className="card-content grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-dark-border rounded p-4">
            <p className="font-medium">Borde simple</p>
          </div>
          <div className="bg-gray-100 dark:bg-dark-bg-tertiary rounded p-4">
            <p className="font-medium">Fondo de color</p>
          </div>
          <div className="shadow-md dark:shadow-lg rounded p-4 bg-white dark:bg-dark-surface">
            <p className="font-medium">Con sombra</p>
          </div>
          <div className="border-l-4 border-primary dark:border-primary-light pl-4">
            <p className="font-medium">Borde de acento</p>
          </div>
        </div>
        <div className="card-footer">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Este es un pie de tarjeta con fondo diferente para contrastar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DarkModeDemo;
