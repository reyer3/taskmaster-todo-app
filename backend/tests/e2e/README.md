# Pruebas End-to-End (E2E)

Esta carpeta contiene las pruebas E2E para la aplicación TaskMaster. Estas pruebas verifican el funcionamiento completo de la aplicación, simulando las interacciones reales de los usuarios.

## Configuración

Para ejecutar las pruebas E2E, necesitas:

1. Una base de datos de prueba separada (configurada en `.env.test`)
2. Todas las dependencias del proyecto instaladas

## Variables de entorno

Crea un archivo `.env.test` en la raíz del proyecto con las siguientes variables:

```
NODE_ENV=test
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/taskmaster_test
JWT_SECRET=test-jwt-secret
PORT=4001
EMAIL_FROM=test@taskmaster.com
FRONTEND_URL=http://localhost:3000
```

## Ejecutar las pruebas

Para ejecutar todas las pruebas E2E:

```bash
npm run test:e2e
```

Para ejecutar una prueba específica:

```bash
npm run test:e2e -- auth.e2e.test.js
```

## Estructura de pruebas E2E

Cada archivo de prueba E2E:

1. Configura un entorno aislado
2. Crea datos de prueba necesarios
3. Realiza llamadas a la API completa
4. Verifica resultados esperados
5. Limpia los datos creados

## Consideraciones

- Las pruebas E2E son más lentas que las unitarias o de integración
- Requieren una base de datos real (aunque de prueba)
- Pueden producir falsos negativos debido a factores externos (red, timing, etc.)
- Son excelentes para validar flujos completos de usuario

## Pruebas implementadas

- **auth.e2e.test.js**: Prueba el flujo completo de autenticación (registro, login, perfil, cambio de contraseña, logout)

## Pruebas pendientes

- Flujo de gestión de tareas (CRUD)
- Notificaciones en tiempo real
- Flujos de permisos y autorización
- Flujos de gestión de preferencias
