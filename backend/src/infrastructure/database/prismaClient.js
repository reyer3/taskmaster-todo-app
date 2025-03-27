/**
 * Cliente Prisma configurado para la aplicación
 * Este archivo centraliza la configuración y exportación del cliente Prisma
 */
const { PrismaClient } = require('@prisma/client');

// Creación de una instancia única de PrismaClient
const prisma = new PrismaClient({
  // Configuración de logging para entornos de desarrollo
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Manejo de conexión y desconexión
const connect = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

const disconnect = async () => {
  await prisma.$disconnect();
  console.log('Database disconnected');
};

// Al cerrar la aplicación, desconectar la BD
process.on('beforeExit', async () => {
  await disconnect();
});

module.exports = {
  prisma,
  connect,
  disconnect
};
