/**
 * Punto de entrada principal del servidor
 * 
 * Este archivo configura y arranca el servidor Express
 */
require('dotenv').config();
const app = require('./app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuración del servidor
const PORT = process.env.PORT || 4000;

// Función para manejar el cierre de la aplicación correctamente
async function gracefulShutdown() {
  console.log('Cerrando conexiones...');
  await prisma.$disconnect();
  process.exit(0);
}

// Manejo de eventos de cierre
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Iniciar el servidor
const server = app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
  
  try {
    // Verifica la conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
});

module.exports = server;
