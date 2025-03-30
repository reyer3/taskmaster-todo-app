# Estrategia de Testing para Taskmaster Backend

## Estructura y Organización

El proyecto utiliza Jest como framework de pruebas. Las pruebas están organizadas en las siguientes categorías:

```
tests/
├── unit/               # Pruebas unitarias
│   ├── services/       # Pruebas para servicios
│   ├── infrastructure/ # Pruebas para componentes de infraestructura
│   │   ├── middlewares/  # Pruebas para middlewares
│   │   ├── repositories/ # Pruebas para repositorios
│   │   └── events/       # Pruebas para sistema de eventos
│   └── domain/         # Pruebas para modelos de dominio
├── integration/        # Pruebas de integración
│   ├── api/            # Pruebas para endpoints de API
│   └── repositories/   # Pruebas para repositorios con BD real
├── coverage/           # Informes de cobertura de código
├── jest.config.js      # Configuración de Jest
└── setup-tests.js      # Configuración global para pruebas
```

## Configuración

- **Jest Config**: `jest.config.js` define la configuración global para Jest.
- **Setup File**: `setup-tests.js` configura el entorno antes de ejecutar las pruebas.
- **Mocks**: Se utilizan mocks para aislar los componentes durante las pruebas unitarias.
- **Cobertura**: Se establece un mínimo del 70% de cobertura para el código crítico.

## Tipos de Pruebas

### Pruebas Unitarias

Las pruebas unitarias verifican el funcionamiento de componentes individuales de forma aislada:

- **Servicios**: Prueban la lógica de negocio utilizando repositorios mockeados.
- **Middlewares**: Prueban la funcionalidad de los middlewares con objetos req/res simulados.
- **Modelos de Dominio**: Verifican la lógica y validaciones de los modelos.

### Pruebas de Integración

Las pruebas de integración verifican la interacción entre múltiples componentes:

- **API Endpoints**: Prueban los endpoints completos, verificando respuestas HTTP.
- **Repositorios**: Prueban la interacción con la base de datos (usando una BD de test).

## Scripts Disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch (útil durante desarrollo)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar solo pruebas unitarias
npm run test:unit

# Ejecutar solo pruebas de integración
npm run test:integration
```

## Mejores Prácticas

1. **Organización**:
   - Mantener la estructura espejo con el código fuente
   - Nombrar archivos de prueba con el sufijo `.test.js` o `.spec.js`

2. **Mocks**:
   - Mockear dependencias externas
   - Evitar depender de servicios externos en pruebas unitarias

3. **Consistencia**:
   - Seguir el patrón AAA: Arrange-Act-Assert
   - Utilizar descripciones claras y específicas

4. **Cobertura**:
   - Priorizar la cobertura de componentes críticos
   - No limitarse a cubrir porcentajes, sino casos de uso importantes

## Configuración para CI/CD

Las pruebas están configuradas para ejecutarse automáticamente en el pipeline de CI/CD:

- **GitHub Actions**: Las pruebas se ejecutan en cada pull request
- **Verificación de cobertura**: Se verifica que la cobertura no disminuya

## Casos de uso clave para probar

- Autenticación y autorización
- Operaciones CRUD de tareas
- Manejo de errores y excepciones
- Eventos y notificaciones
