# Módulo de Tareas

Este directorio contiene el controlador para las operaciones relacionadas con la gestión de tareas en la aplicación TaskMaster.

## Estructura Actual

- `task.controller.js`: Implementa tanto los controladores como las rutas para las operaciones CRUD de tareas.

## Responsabilidades

El controlador en este directorio es responsable de:

- Crear nuevas tareas
- Obtener tareas de un usuario
- Filtrar tareas próximas a vencer
- Actualizar tareas existentes
- Eliminar tareas
- Marcar tareas como completadas o pendientes

## Implementación

El módulo utiliza Express Router para definir los endpoints de la API. Cada ruta está protegida por un middleware de autenticación que garantiza que solo los usuarios autenticados puedan acceder a las operaciones de tareas. Las validaciones se realizan tanto en el controlador como en la capa de servicio.

## Endpoints Principales

- `GET /api/tasks`: Obtiene todas las tareas del usuario autenticado
- `GET /api/tasks/upcoming`: Obtiene tareas próximas a vencer
- `POST /api/tasks`: Crea una nueva tarea
- `PUT /api/tasks/:id`: Actualiza una tarea existente
- `DELETE /api/tasks/:id`: Elimina una tarea
- `PATCH /api/tasks/:id/complete`: Marca una tarea como completada o pendiente

## Seguridad

Todas las operaciones verifican que el usuario autenticado sea el propietario de las tareas, implementando un control de acceso basado en la propiedad de los recursos.
