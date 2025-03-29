# Configuración de Base de Datos

Este directorio contiene la configuración de la base de datos y utilidades relacionadas.

## Estructura

- `prisma.js`: Cliente de Prisma y configuración principal
- `seeds/`: Scripts de seed para la base de datos
- `migrations/`: Migraciones de la base de datos

## Responsabilidades

Los archivos en este directorio son responsables de:
- Configurar la conexión a la base de datos
- Proporcionar una instancia del cliente Prisma
- Gestionar migraciones
- Poblar la base de datos con datos iniciales