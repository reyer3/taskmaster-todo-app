/**
 * Cliente Prisma configurado para la aplicación
 * Este archivo centraliza la configuración y exportación del cliente Prisma
 */
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno específicas según el entorno
if (process.env.NODE_ENV === 'test') {
  const envTestPath = path.resolve(process.cwd(), '.env.test');
  if (fs.existsSync(envTestPath)) {
    require('dotenv').config({ path: envTestPath });
    console.log('Loaded test environment variables from .env.test');
  }
}

// Verificar que DATABASE_URL esté definida
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida en las variables de entorno');
}

// Opciones para el cliente Prisma
const prismaOptions = {
  // Configuración de logging
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
};

// Configuración específica para el entorno de prueba
if (process.env.NODE_ENV === 'test') {
  // Durante las pruebas, usar un cliente mock o configuraciones especiales si es necesario
  // No configuramos datasources, porque se maneja a través de la variable DATABASE_URL
}

// Creación de una instancia única de PrismaClient
let prisma;
try {
  prisma = new PrismaClient(prismaOptions);
} catch (error) {
  console.error('Error al inicializar Prisma:', error);
  // Proporcionar un cliente mock o de fallback para pruebas si es necesario
  if (process.env.NODE_ENV === 'test') {
    // Proporcionar un cliente mock para tests
    prisma = {};
    console.warn('Usando cliente Prisma mock para pruebas');
  } else {
    throw error; // Re-lanzar el error en entornos que no sean de prueba
  }
}

// Manejo de conexión y desconexión
const connect = async () => {
  if (!prisma.$connect) {
    console.warn('Cliente Prisma no tiene método $connect, posiblemente usando mock');
    return;
  }
  
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

const disconnect = async () => {
  if (!prisma.$disconnect) {
    console.warn('Cliente Prisma no tiene método $disconnect, posiblemente usando mock');
    return;
  }
  
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
