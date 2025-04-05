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

// Opción para prevenir conexiones reales a la DB durante las pruebas
const prismaOptions = {
  datasources: process.env.NODE_ENV === 'test' ? {} : {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configuración de logging
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
};

// Creación de una instancia única de PrismaClient
const prisma = new PrismaClient(prismaOptions);

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
