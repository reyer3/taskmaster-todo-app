/**
 * Punto de entrada para entorno serverless (Vercel)
 * 
 * Este archivo adapta la aplicación Express para funcionar en Vercel
 */
require('dotenv').config();
const app = require('./app');
const { bootstrap } = require('./bootstrap');

// Variable para almacenar los componentes inicializados
let components;

// Función para inicializar la aplicación si no está ya inicializada
async function initializeIfNeeded() {
  if (!components) {
    try {
      components = await bootstrap({
        enableWebSockets: false, // WebSockets no disponibles en entorno serverless
        enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
        enableNotificationCleanup: false // No configurar intervalos en serverless
      });
      
      // Inyectar componentes en la aplicación
      app.set('components', components);
      console.log('✅ Componentes inicializados para entorno serverless');
    } catch (error) {
      console.error('❌ Error al inicializar componentes:', error);
      throw error;
    }
  }
  return components;
}

// Manejador de solicitudes para Vercel
module.exports = async (req, res) => {
  // Inicializar componentes si es necesario
  try {
    await initializeIfNeeded();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error al inicializar el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Procesar la solicitud con Express
  return app(req, res);
};
