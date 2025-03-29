# Tests End-to-End

Esta carpeta contiene los tests end-to-end para el backend de la aplicación, verificando flujos completos desde la API hasta la base de datos.

## Organización

```
e2e/
├── auth/           # Tests E2E para flujos de autenticación
├── tasks/          # Tests E2E para gestión de tareas
└── utils/          # Utilidades compartidas para tests E2E
```

## Enfoque

Los tests end-to-end deben:

1. Probar flujos completos de usuarios
2. Interactuar con el sistema a través de su API pública
3. Utilizar una base de datos dedicada para testing
4. Simular un entorno lo más cercano posible a producción
5. Cubrir los casos de uso principales de la aplicación
