# Guía de Despliegue en Vercel

Esta guía explica cómo desplegar TaskMaster Todo App en Vercel con la base de datos en Neon.

## Configuración Previa

### 1. Base de Datos Neon

1. Crear cuenta en [Neon](https://neon.tech/) si aún no tienes una
2. Crear un nuevo proyecto en Neon
3. Obtener la cadena de conexión (DATABASE_URL) con el formato:
   ```
   postgresql://user:password@endpoint:5432/database?sslmode=require
   ```

### 2. Variables de Entorno

Las siguientes variables de entorno deben configurarse en Vercel:

```
# Base de datos
DATABASE_URL=postgresql://user:password@endpoint:5432/database?sslmode=require

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# Servidor
NODE_ENV=production
CORS_ORIGIN=https://your-production-url.vercel.app

# Notificaciones
ENABLE_NOTIFICATIONS=true
ENABLE_WEBSOCKETS=false
```

## Procedimiento de Despliegue

### Opción 1: Despliegue Desde CLI

1. Instalar Vercel CLI si aún no está instalado:
   ```bash
   npm install -g vercel
   ```

2. Autenticar en Vercel:
   ```bash
   vercel login
   ```

3. Iniciar el despliegue:
   ```bash
   npm run deploy
   ```

4. Configurar variables de entorno:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   # Añadir las demás variables...
   ```

### Opción 2: Despliegue Desde el Dashboard de Vercel

1. Crear nueva cuenta/proyecto en [Vercel](https://vercel.com/)
2. Importar repositorio desde GitHub
3. Configurar los siguientes ajustes:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm run install:all`
4. Añadir todas las variables de entorno mencionadas anteriormente
5. Desplegar

## Verificación del Despliegue

Una vez desplegado, verifica las siguientes funcionalidades:

1. Acceso a la página principal
2. Registro e inicio de sesión
3. Crear, editar y eliminar tareas
4. Sistema de notificaciones (sin WebSockets en Vercel)

## Solución de Problemas Comunes

### Error de Conexión a la Base de Datos

- Verifica que la URL de Neon sea correcta
- Asegúrate de que la opción `?sslmode=require` esté incluida
- Confirma que el IP de Vercel no esté bloqueado en Neon

### Error de CORS

- Verifica que `CORS_ORIGIN` tenga la URL correcta de tu aplicación desplegada
- Si es necesario, habilita temporalmente `*` para permitir todos los orígenes

### Problema con Notificaciones

- WebSockets no funcionan en el entorno serverless de Vercel
- Se ha deshabilitado la funcionalidad de WebSockets en el despliegue
- Las notificaciones por email siguen funcionando normalmente

## Mantenimiento

- Cada nuevo despliegue se realiza automáticamente al hacer push a la rama principal
- Para actualizar variables de entorno, usa el dashboard de Vercel o la CLI:
  ```bash
  vercel env add NUEVA_VARIABLE
  ```

## Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Neon](https://neon.tech/docs)
- [Guía de Express.js en Vercel](https://vercel.com/guides/using-express-with-vercel)
