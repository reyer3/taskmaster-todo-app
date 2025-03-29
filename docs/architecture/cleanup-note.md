# Nota sobre la Limpieza del Código Duplicado

Durante la implementación de la arquitectura DDD-Light, se identificó código duplicado donde se crearon nuevos archivos con funcionalidad similar a los ya existentes. Para mantener la coherencia y evitar duplicación, se recomienda seguir estos pasos:

## Archivos a Consolidar

### Modelos de Dominio

1. Unificar `Task.js` y `task.model.js`
   - Mantener `task.model.js` como el archivo principal
   - Transferir patrones y mejoras de `Task.js` a `task.model.js`

2. Unificar `User.js` y `user.model.js`
   - Mantener `user.model.js` como el archivo principal
   - Transferir patrones y mejoras de `User.js` a `user.model.js`

### Servicios y Repositorios

1. Revisar `TaskService.js` y cualquier servicio existente relacionado con tareas
   - Consolidar la funcionalidad siguiendo los principios DDD-Light

2. Revisar `AuthService.js` y cualquier servicio existente relacionado con autenticación
   - Consolidar la funcionalidad siguiendo los principios DDD-Light

3. Revisar `TaskRepository.js` y `UserRepository.js` contra implementaciones existentes
   - Asegurar que sigan el patrón repositorio de DDD-Light

## Pasos para la Refactorización

1. Identificar todos los archivos duplicados en el proyecto
2. Decidir qué versión mantener (generalmente la existente, pero con mejoras)
3. Migrar las mejores prácticas y patrones de diseño a los archivos existentes
4. Eliminar los archivos duplicados
5. Actualizar referencias en todo el código
6. Probar exhaustivamente la funcionalidad

## Principios a Seguir Durante la Consolidación

1. **Tell, Don't Ask**: Asegurar que las entidades tengan comportamiento, no solo datos
2. **Inyección de Dependencias**: Los servicios deben recibir sus dependencias, no crearlas
3. **Validación en Dominio**: Las reglas de negocio deben estar en las entidades de dominio
4. **Capas Claras**: Mantener la separación entre API, servicios, dominio e infraestructura

## Documentación

Los archivos README.md y la guía DDD-Light son válidos y proporcionan información valiosa sobre cómo debe organizarse el código. Úselos como referencia durante la consolidación.

## Propuesta de Trabajo

Se recomienda crear un nuevo issue específico para la tarea de unificación del código duplicado como parte de la implementación completa de DDD-Light.
