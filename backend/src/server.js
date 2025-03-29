/**
 * Punto de entrada principal del servidor
 * 
 * Este archivo configura y arranca el servidor Express
 */
require('dotenv').config();
const app = require('./app');
const { bootstrap } = require('./bootstrap');
const http = require('http');

// Componentes de la aplicación
let components;

// Configuración del servidor
const PORT = process.env.PORT || 4000;

// Función para manejar el cierre de la aplicación correctamente
async function gracefulShutdown() {
  console.log('Iniciando cierre ordenado...');
  
  if (components && components.shutdown) {
    await components.shutdown();
  }
  
  process.exit(0);
}

// Manejo de eventos de cierre
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Inicializar componentes y arrancar servidor
async function startServer() {
  try {
    // Crear servidor HTTP a partir de Express
    const server = http.createServer(app);
    
    // Inicializar componentes de la aplicación, pasando el servidor HTTP para WebSockets
    components = await bootstrap({
      enableWebSockets: process.env.ENABLE_WEBSOCKETS !== 'false',
      enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false'
    }, server);
    
    // Inyectar componentes en la aplicación
    app.set('components', components);
    
    // Iniciar el servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
      
      // Mostrar información sobre WebSockets
      if (components.websockets && components.websockets.enabled) {
        console.log('🔌 WebSockets habilitados para notificaciones en tiempo real');
      } else {
        console.log('ℹ️ WebSockets deshabilitados');
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Arrancar el servidor
const serverPromise = startServer();

// Exportar la promesa del servidor para pruebas
module.exports = serverPromise;
