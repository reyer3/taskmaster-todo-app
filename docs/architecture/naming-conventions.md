# Convenciones de Nomenclatura

Este documento define las convenciones de nomenclatura a seguir en el proyecto TaskMaster para mantener la consistencia en todo el código.

## Convenciones Generales

- Utilizar kebab-case para nombres de archivos
- Utilizar camelCase para nombres de variables y funciones
- Utilizar PascalCase para nombres de clases e interfaces
- Utilizar UPPER_SNAKE_CASE para constantes

## Nomenclatura de Archivos

### Backend

#### Modelos de Dominio
Los modelos de dominio se nombran siguiendo el patrón: `{nombre}.model.js`

Ejemplos:
- `task.model.js`
- `user.model.js`

#### Servicios
Los servicios se nombran siguiendo el patrón: `{nombre}.service.js`

Ejemplos:
- `auth.service.js`
- `task.service.js`

#### Controladores
Los controladores se nombran siguiendo el patrón: `{nombre}.controller.js`

Ejemplos:
- `auth.controller.js`
- `task.controller.js`

#### Repositorios
Los repositorios se nombran siguiendo el patrón: `{nombre}.repository.js`

Ejemplos:
- `user.repository.js`
- `task.repository.js`

#### Middlewares
Los middlewares se nombran siguiendo el patrón: `{nombre}.middleware.js`

Ejemplos:
- `auth.middleware.js`
- `validation.middleware.js`

#### Utilidades
Las utilidades se nombran siguiendo el patrón: `{nombre}.util.js`

Ejemplos:
- `date.util.js`
- `string.util.js`

### Frontend

#### Componentes React
Los componentes React se nombran siguiendo el patrón: `{Nombre}Component.jsx`

Ejemplos:
- `TaskCardComponent.jsx`
- `LoginFormComponent.jsx`

#### Hooks
Los hooks personalizados se nombran siguiendo el patrón: `use{Nombre}.js`

Ejemplos:
- `useAuth.js`
- `useTasks.js`

#### Servicios
Los servicios en el frontend siguen el mismo patrón que en el backend: `{nombre}.service.js`

Ejemplos:
- `api.service.js`
- `storage.service.js`

#### Utilidades
Las utilidades siguen el mismo patrón que en el backend: `{nombre}.util.js`

Ejemplos:
- `date.util.js`
- `validation.util.js`

## Convenciones de Nombrado

### Clases

- Las clases deben usar PascalCase y nombres descriptivos
- Los nombres deben ser sustantivos o frases nominales

Ejemplos:
```javascript
class TaskRepository { /* ... */ }
class AuthService { /* ... */ }
```

### Métodos y Funciones

- Los métodos y funciones deben usar camelCase
- Los nombres deben iniciar con un verbo que describa la acción

Ejemplos:
```javascript
async function findUserById(id) { /* ... */ }
async function createTask(data) { /* ... */ }
```

### Variables

- Las variables deben usar camelCase
- Los nombres deben ser descriptivos y evitar abreviaciones confusas

Ejemplos:
```javascript
const userTasks = [];
let isAuthenticated = false;
```

### Constantes

- Las constantes globales deben usar UPPER_SNAKE_CASE

Ejemplos:
```javascript
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGINATION_LIMIT = 10;
```

## Estructura de Directorios

La estructura de directorios debe seguir el patrón definido en el ADR-0002 de DDD-Light, manteniendo la organización por dominio en lugar de por tipo de archivo.
