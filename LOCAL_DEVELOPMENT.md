# Desarrollo Local con Docker

Este documento explica cómo ejecutar la aplicación TaskMaster en un entorno de desarrollo local utilizando Docker.

## Requisitos Previos

- Docker y Docker Compose instalados en tu máquina
- Git

## Configuración Inicial

1. Clona el repositorio:
   ```bash
   git clone https://github.com/reyer3/taskmaster-todo-app.git
   cd taskmaster-todo-app
   ```

2. Inicia los servicios con Docker Compose:
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

   Este comando iniciará:
   - PostgreSQL (accesible en localhost:5432)
   - Backend de Express (accesible en localhost:4000)
   - Frontend de React con Vite (accesible en localhost:5173)

3. Accede a la aplicación en tu navegador:
   ```
   http://localhost:5173
   ```

## Estructura de Servicios

### Base de Datos

- **PostgreSQL**: Base de datos relacional
  - **Usuario**: postgres
  - **Contraseña**: postgres
  - **Base de datos**: taskmaster
  - **Puerto**: 5432
  - **Volumen**: Los datos persisten en un volumen de Docker

### Backend

- **Express API**: Ejecutándose con nodemon para reinicio automático
  - **Puerto**: 4000
  - **URL**: http://localhost:4000
  - **Desarrollo en vivo**: Los cambios en el código se detectan y el servidor se reinicia automáticamente
  - **Variables de entorno**: Configuradas en docker-compose.local.yml

### Frontend

- **React con Vite**: Servidor de desarrollo con recarga en caliente
  - **Puerto**: 5173
  - **URL**: http://localhost:5173
  - **Desarrollo en vivo**: Los cambios en el código se reflejan inmediatamente en el navegador
  - **Variables de entorno**: VITE_API_URL apunta al backend local

## Comandos Útiles

### Ver los logs de los servicios
```bash
# Todos los servicios
docker-compose -f docker-compose.local.yml logs -f

# Solo el backend
docker-compose -f docker-compose.local.yml logs -f backend

# Solo el frontend
docker-compose -f docker-compose.local.yml logs -f frontend
```

### Ejecutar comandos en los contenedores
```bash
# Acceder al shell del backend
docker-compose -f docker-compose.local.yml exec backend sh

# Ejecutar pruebas en el backend
docker-compose -f docker-compose.local.yml exec backend npm test

# Acceder al shell del frontend
docker-compose -f docker-compose.local.yml exec frontend sh

# Herramientas de desarrollo del frontend
docker-compose -f docker-compose.local.yml exec frontend npm run lint
```

### Base de datos
```bash
# Acceder a PostgreSQL
docker-compose -f docker-compose.local.yml exec postgres psql -U postgres -d taskmaster

# Hacer copia de seguridad
docker-compose -f docker-compose.local.yml exec postgres pg_dump -U postgres taskmaster > backup.sql

# Restaurar copia de seguridad
cat backup.sql | docker-compose -f docker-compose.local.yml exec -T postgres psql -U postgres -d taskmaster
```

### Detener y eliminar servicios
```bash
# Detener los servicios
docker-compose -f docker-compose.local.yml down

# Detener los servicios y eliminar volúmenes (¡perderás los datos!)
docker-compose -f docker-compose.local.yml down -v
```

## Solución de Problemas

### El backend no puede conectarse a la base de datos
Verifica que:
- PostgreSQL está ejecutándose: `docker-compose -f docker-compose.local.yml ps`
- La URL de la base de datos es correcta en las variables de entorno
- La base de datos está inicializada: `docker-compose -f docker-compose.local.yml logs postgres`

### El frontend no puede conectarse al backend
Verifica que:
- El backend está ejecutándose: `docker-compose -f docker-compose.local.yml ps`
- VITE_API_URL está configurado correctamente
- No hay errores CORS: revisa los logs del backend

### Los cambios no se detectan
Para el backend:
- Verifica que nodemon está funcionando: `docker-compose -f docker-compose.local.yml logs backend`
- Reinicia el servicio: `docker-compose -f docker-compose.local.yml restart backend`

Para el frontend:
- Verifica que Vite está funcionando: `docker-compose -f docker-compose.local.yml logs frontend`
- Reinicia el servicio: `docker-compose -f docker-compose.local.yml restart frontend`

## Desarrollo Avanzado

### Añadir dependencias NPM
```bash
# Añadir dependencia al backend
docker-compose -f docker-compose.local.yml exec backend npm install --save package-name

# Añadir dependencia de desarrollo al backend
docker-compose -f docker-compose.local.yml exec backend npm install --save-dev package-name

# Añadir dependencia al frontend
docker-compose -f docker-compose.local.yml exec frontend npm install --save package-name
```

### Ejecutar migraciones de Prisma
```bash
# Generar migraciones
docker-compose -f docker-compose.local.yml exec backend npx prisma migrate dev --name migration-name

# Aplicar migraciones
docker-compose -f docker-compose.local.yml exec backend npx prisma migrate deploy

# Ver Prisma Studio
docker-compose -f docker-compose.local.yml exec backend npx prisma studio
```

### Ejecutar linting y formato
```bash
# Backend
docker-compose -f docker-compose.local.yml exec backend npm run lint
docker-compose -f docker-compose.local.yml exec backend npm run format

# Frontend
docker-compose -f docker-compose.local.yml exec frontend npm run lint
docker-compose -f docker-compose.local.yml exec frontend npm run format
```

### Trabajar en múltiples ramas
Para cambiar entre ramas de Git mientras se ejecuta Docker:

1. Detén los contenedores: `docker-compose -f docker-compose.local.yml down`
2. Cambia de rama: `git checkout otra-rama`
3. Reinicia los contenedores: `docker-compose -f docker-compose.local.yml up -d`

Este enfoque asegura que los volúmenes de node_modules se actualicen correctamente con las dependencias de la nueva rama.
