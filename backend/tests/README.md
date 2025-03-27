# Tests del Backend

Este directorio contiene los tests para las diferentes partes del backend.

## Estructura

- `domain/`: Tests para la lógica de dominio
- `api/`: Tests para los controladores y rutas
- `services/`: Tests para los servicios de aplicación
- `repositories/`: Tests para los repositorios
- `integration/`: Tests de integración
- `e2e/`: Tests end-to-end

## Ejecución de tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests de un directorio específico
npm test -- --testPathPattern=domain

# Ejecutar tests con coverage
npm test -- --coverage
```