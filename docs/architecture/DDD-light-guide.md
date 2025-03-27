# Guía de Implementación DDD-Light

Esta guía proporciona directrices sobre cómo implementar la arquitectura DDD-Light en TaskMaster, siguiendo el ADR-0002.

## ¿Qué es DDD-Light?

DDD-Light es una versión simplificada de Domain-Driven Design que mantiene los principios clave del enfoque original pero con menos complejidad. Se centra en:

- **Modelado del dominio**: Expresar el modelo de negocio en el código
- **Aislamiento del dominio**: Proteger la lógica de negocio de detalles técnicos
- **Lenguaje ubicuo**: Usar los mismos términos en el código que en las conversaciones de negocio

A diferencia del DDD clásico, omitimos algunos conceptos más avanzados como Aggregates, Factory patterns, etc., para mantener la simplicidad.

## Estructura de Capas

### 1. Capa de Dominio

Ubicación: `/backend/src/domain`

Contiene entidades y lógica de negocio. Las entidades deben:

- Encapsular sus datos
- Validar su estado
- Implementar comportamiento relevante
- Seguir el principio "Tell, Don't Ask"

**Ejemplo**:

```javascript
// User.js en domain/auth
class User {
  constructor({ id, email, name, ... }) {
    this._validateEmail(email);
    // ...
  }
  
  // Métodos de validación
  _validateEmail(email) { ... }
  
  // Comportamiento
  markAsActive() { ... }
  changeRole(role) { ... }
}
```

### 2. Capa de Aplicación (Servicios)

Ubicación: `/backend/src/services`

Implementa casos de uso de la aplicación, orquestando entidades de dominio. Los servicios deben:

- Implementar un caso de uso específico
- No contener lógica de negocio (solo orquestar)
- Recibir dependencias mediante inyección

**Ejemplo**:

```javascript
// TaskService.js
class TaskService {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }
  
  async createTask(taskData, userId) {
    const task = new Task({ ...taskData, userId });
    return this.taskRepository.create(task);
  }
}
```

### 3. Capa de Infraestructura

Ubicación: `/backend/src/infrastructure`

Implementa detalles técnicos y adaptadores para servicios externos. Incluye:

- Repositorios (implementaciones de acceso a datos)
- Configuración de base de datos
- Middlewares
- Integraciones con servicios externos

**Ejemplo**:

```javascript
// TaskRepository.js
class TaskRepository {
  async findById(id) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return null;
    return new Task(task);
  }
}
```

### 4. Capa de API (Adaptadores)

Ubicación: `/backend/src/api`

Gestiona la comunicación con el exterior. Incluye:

- Controladores
- Validación de entrada
- Transformación de datos
- Manejo de errores HTTP

**Ejemplo**:

```javascript
// taskController.js
router.post('/', authMiddleware, async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

## Principios a Seguir

### Tell, Don't Ask

En lugar de preguntar por el estado de un objeto y luego tomar decisiones, pide al objeto que realice la operación.

- **Mal**: `if (task.completed === false) { task.completed = true; }`
- **Bien**: `task.markAsCompleted();`

### Inyección de Dependencias

Las dependencias deben ser inyectadas, no instanciadas dentro de las clases:

- **Mal**: `this.repository = new TaskRepository();`
- **Bien**: `constructor(taskRepository) { this.repository = taskRepository; }`

### Inmutabilidad

Favorece objetos inmutables siempre que sea posible:

- **Mal**: `user.name = newName;`
- **Bien**: `const updatedUser = user.withName(newName);`

### Validaciones en el Dominio

Las entidades deben validar su propio estado:

- **Mal**: Validar en el controlador o servicio
- **Bien**: Validar en el constructor/métodos de la entidad

## Frontend

Para el frontend, seguimos una estructura similar pero adaptada a React:

- `/features`: Organizado por dominio de negocio
- `/components`: Componentes reutilizables
- `/services`: Comunicación con API
- `/hooks`: Custom hooks de React

En React, los componentes deben ser principalmente presentacionales, y la lógica de negocio debe estar en custom hooks o servicios.

## Ejemplo Completo

Ver los ejemplos de código en los directorios:
- `/backend/src/domain/tasks/Task.js`
- `/backend/src/services/TaskService.js`
- `/backend/src/infrastructure/repositories/TaskRepository.js`
- `/backend/src/api/tasks/taskController.js`

## Recursos Adicionales

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)
- [Tell, Don't Ask Principle](https://martinfowler.com/bliki/TellDontAsk.html)
