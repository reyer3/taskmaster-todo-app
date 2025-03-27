# Tests Unitarios

Esta carpeta contiene los tests unitarios para el backend de la aplicación, organizados por capa y dominio.

## Organización

```
unit/
├── domain/           # Tests para modelos y lógica de dominio
│   ├── auth/           # Tests para modelos de autenticación
│   └── tasks/          # Tests para modelos de tareas
├── services/         # Tests para servicios de aplicación
└── utils/            # Tests para utilidades
```

## Enfoque

Los tests unitarios deben:

1. Probar una única unidad de código en aislamiento
2. Mockear todas las dependencias externas
3. Ser rápidos de ejecutar
4. No depender de recursos externos (BD, API, etc.)
5. Cubrir casos de éxito y casos de error
