# Tests de Integración

Esta carpeta contiene los tests de integración para el backend de la aplicación, verificando la interacción entre múltiples componentes.

## Organización

```
integration/
├── api/              # Tests para endpoints de la API
│   ├── auth/           # Tests para endpoints de autenticación
│   └── tasks/          # Tests para endpoints de tareas
└── infrastructure/   # Tests para componentes de infraestructura
    ├── database/       # Tests para acceso a base de datos
    └── repositories/   # Tests para repositorios
```

## Enfoque

Los tests de integración deben:

1. Probar la interacción entre varios componentes
2. Utilizar una base de datos de prueba (no mockear el acceso a datos)
3. Verificar flujos completos
4. Ejecutarse en un entorno similar al de producción
5. Limpiar el estado entre tests para evitar dependencias
