# Despliegue en urbanlink.pe

Este documento describe el proceso de despliegue de TaskMaster en urbanlink.pe utilizando Docker, Traefik y GitHub Actions.

## Arquitectura de despliegue

El despliegue se realiza con la siguiente arquitectura:

- **Frontend**: Accesible en https://taskmaster.urbanlink.pe
- **Backend API**: Accesible en https://api.taskmaster.urbanlink.pe
- **Traefik**: Proxy inverso que maneja el enrutamiento y los certificados SSL
- **Docker**: Contenedores para cada servicio
- **GitHub Actions**: Automatización del despliegue

## Requisitos previos

1. Acceso SSH al servidor urbanlink.pe
2. Credenciales de CloudFlare para gestionar certificados SSL
3. Docker y Docker Compose instalados en el servidor
4. Base de datos PostgreSQL (recomendado: Neon)

## Secrets necesarios en GitHub

Para que el despliegue funcione, es necesario configurar los siguientes secrets en el repositorio de GitHub:

- `SSH_PRIVATE_KEY`: Clave SSH privada para acceder al servidor
- `SSH_USER`: Usuario SSH para el servidor
- `HOST_IP`: Dirección IP del servidor
- `DATABASE_URL`: URL de conexión a la base de datos PostgreSQL
- `JWT_SECRET`: Clave secreta para los JWT
- `JWT_EXPIRATION`: Tiempo de expiración para los tokens JWT (opcional, predeterminado: 1d)
- `JWT_REFRESH_EXPIRATION`: Tiempo de expiración para los tokens de refresco (opcional, predeterminado: 7d)
- `CLOUDFLARE_EMAIL`: Email de la cuenta de CloudFlare
- `CLOUDFLARE_API_KEY`: API key global de CloudFlare

## Proceso de despliegue manual

Si necesitas realizar un despliegue manual, sigue estos pasos:

### 1. Configuración del servidor

```bash
# Conéctate al servidor
ssh usuario@urbanlink.pe

# Crea el directorio para la aplicación
mkdir -p ~/taskmaster

# Crea la red de Docker si no existe
docker network create web
```

### 2. Configuración de las variables de entorno

Crea un archivo `.env` en el directorio `~/taskmaster` con las siguientes variables:

```
DATABASE_URL=postgresql://user:password@neon-host:5432/database?sslmode=require
JWT_SECRET=tu_jwt_secret_aqui
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d
CLOUDFLARE_EMAIL=tu_email_de_cloudflare
CLOUDFLARE_API_KEY=tu_api_key_de_cloudflare
```

### 3. Despliegue con Docker Compose

```bash
# Navega al directorio de la aplicación
cd ~/taskmaster

# Despliega con Docker Compose
docker-compose up -d --build
```

## Estructura de archivos

- `docker-compose.yml`: Configuración de los servicios Docker
- `traefik/config/`: Configuración de Traefik para SSL y seguridad
- `frontend/Dockerfile`: Instrucciones para construir la imagen del frontend
- `frontend/nginx.conf`: Configuración de Nginx para servir la aplicación React
- `backend/Dockerfile`: Instrucciones para construir la imagen del backend
- `.github/workflows/deploy.yml`: Workflow de GitHub Actions para despliegue automático

## Solución de problemas comunes

### Problemas con certificados SSL

Si hay problemas con los certificados SSL:

```bash
# Verifica los logs de Traefik
docker logs traefik

# Asegúrate de que los permisos del archivo acme.json sean correctos
chmod 600 ~/taskmaster/traefik/config/acme.json
```

### Problemas de conexión a la base de datos

Si hay problemas de conexión a la base de datos:

```bash
# Verifica los logs del backend
docker logs taskmaster-backend

# Asegúrate de que la URL de la base de datos sea correcta
nano ~/taskmaster/.env
```

### Problemas de redirección o CORS

Si hay problemas de redirección o CORS:

```bash
# Verifica la configuración de CORS en el backend
docker exec -it taskmaster-backend cat /app/src/app.js

# Asegúrate de que la configuración de Nginx es correcta
docker exec -it taskmaster-frontend cat /etc/nginx/conf.d/default.conf
```

## Mantenimiento

### Actualización de la aplicación

Para actualizar la aplicación, simplemente haz push a la rama main y GitHub Actions se encargará del despliegue automáticamente.

Si necesitas hacerlo manualmente:

```bash
ssh usuario@urbanlink.pe
cd ~/taskmaster
git pull
docker-compose up -d --build
```

### Monitoreo

```bash
# Ver logs de los contenedores
docker logs taskmaster-frontend
docker logs taskmaster-backend
docker logs traefik

# Ver estado de los contenedores
docker-compose ps
```

### Backup de datos

La base de datos se gestiona externamente en Neon, que proporciona su propio sistema de backups.

## Diagrama de la arquitectura

```
                   +-------------+
                   |  CloudFlare |
                   +------+------+
                          |
                          v
+---------------------------+
|        Traefik Proxy      |
|   (SSL, Load Balancing)   |
+--+----------+-------------+
   |          |
   v          v
+------+  +--------+
|React |  |Express |
|Front |  |API     |
+------+  +--------+
              |
              v
        +------------+
        |PostgreSQL  |
        |  (Neon)    |
        +------------+
```
