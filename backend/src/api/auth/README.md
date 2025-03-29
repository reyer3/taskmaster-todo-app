# Módulo de Autenticación

Este directorio contiene los controladores y rutas relacionados con la autenticación de usuarios.

## Estructura

- `auth.controller.js`: Controladores para las operaciones de autenticación
- `auth.routes.js`: Definición de rutas para la API de autenticación
- `auth.validation.js`: Validaciones para las peticiones de autenticación

## Responsabilidades

Los controladores en este directorio son responsables de:
- Registrar nuevos usuarios
- Autenticar usuarios existentes (login)
- Validar tokens JWT
- Gestionar la renovación de tokens
- Gestionar el cierre de sesión