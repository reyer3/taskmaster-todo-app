# Módulo de Autenticación

Este directorio contiene el controlador para las operaciones de autenticación y gestión de usuarios en la aplicación TaskMaster.

## Estructura Actual

- `auth.controller.js`: Implementa tanto los controladores como las rutas y validaciones para las operaciones de autenticación.

## Responsabilidades

El controlador en este directorio es responsable de:

- Registrar nuevos usuarios
- Autenticar usuarios existentes (login)
- Gestionar perfiles de usuario
- Cambiar contraseñas
- Gestionar la renovación de tokens JWT
- Gestionar el cierre de sesión

## Implementación

El módulo utiliza Express Router para definir los endpoints de la API. Las validaciones están implementadas mediante funciones auxiliares dentro del mismo archivo del controlador. Cada endpoint incluye manejo de errores y validaciones específicas para garantizar la consistencia de los datos.

## Endpoints Principales

- `POST /api/auth/register`: Registra un nuevo usuario
- `POST /api/auth/login`: Autentica a un usuario existente
- `GET /api/auth/me`: Obtiene información del perfil del usuario autenticado
- `PUT /api/auth/me`: Actualiza el perfil de usuario
- `POST /api/auth/change-password`: Cambia la contraseña del usuario
- `POST /api/auth/refresh-token`: Renueva el token de acceso
- `POST /api/auth/logout`: Cierra la sesión del usuario
