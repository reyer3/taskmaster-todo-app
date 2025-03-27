# 0002 - Implementación de arquitectura DDD-Light

Fecha: 2025-03-27

## Estado

Aceptado

## Contexto

El proyecto TaskMaster requiere una arquitectura que permita:
- Organización clara del código
- Separación de responsabilidades
- Mantenibilidad a largo plazo
- Testabilidad de los componentes
- Escalabilidad para añadir nuevas funcionalidades
- Facilidad para implementar los principios SOLID

Al mismo tiempo, se necesita mantener la simplicidad siguiendo el principio KISS (Keep It Simple, Stupid) debido a las restricciones de tiempo y recursos del proyecto.

## Decisión

Hemos decidido implementar una arquitectura **DDD-Light** (Domain-Driven Design simplificado) que incorpora elementos de la **Arquitectura Limpia (Clean Architecture)** y el principio **Tell, Don't Ask**. Esta arquitectura será aplicada tanto en el backend como en el frontend del proyecto.

### Estructura del Backend

```
backend/
├── src/
│   ├── api/            # Controladores Express (capa de presentación)
│   │   ├── auth/       # Endpoints de autenticación
│   │   └── tasks/      # Endpoints de tareas
│   ├── domain/         # Modelos y lógica de negocio (capa de dominio)
│   │   ├── auth/       # Dominio de autenticación
│   │   └── tasks/      # Dominio de tareas
│   ├── services/       # Servicios de aplicación (capa de aplicación)
│   ├── infrastructure/ # ORM, BD, servicios externos (capa de infraestructura)
│   │   ├── database/   # Configuración de bases de datos
│   │   ├── middlewares/# Middlewares de Express
│   │   └── repositories/# Implementaciones de repositorios
│   └── utils/          # Utilidades y helpers comunes
├── tests/              # Tests separados por dominio
├── prisma/             # Esquema de Prisma y migraciones
└── ...
```

### Estructura del Frontend

```
frontend/
├── src/
│   ├── components/     # Componentes React reutilizables
│   ├── features/       # Características organizadas por dominio
│   │   ├── auth/       # Todo lo relacionado con autenticación
│   │   ├── tasks/      # Todo lo relacionado con tareas
│   │   └── ui/         # Componentes UI compartidos
│   ├── hooks/          # Custom hooks
│   ├── services/       # Servicios para API
│   ├── utils/          # Utilidades y helpers
│   └── context/        # Contextos de React (estado global)
├── tests/              # Tests organizados como el código fuente
└── ...
```

### Principios a seguir

1. **Dominios claros**: El código se organiza por dominios de negocio, no por tipos de archivos.
2. **Dependencias unidireccionales**: Las capas externas dependen de las internas, no al revés.
3. **Tell, Don't Ask**: Los objetos deben tener comportamiento, no solo datos.
4. **Inmutabilidad**: Favorecer estructuras de datos inmutables cuando sea posible.
5. **Principio de una sola responsabilidad**: Cada clase o componente tiene una única razón para cambiar.
6. **Interfaces explícitas**: Las dependencias se inyectan a través de interfaces explícitas.

## Consecuencias

### Positivas

* Código más organizado y fácil de entender
* Separación clara de responsabilidades
* Facilita el testing al tener componentes desacoplados
* Permite cambiar implementaciones concretas sin afectar la lógica de negocio
* Mejora la mantenibilidad a largo plazo
* Facilita el trabajo en equipo al tener límites claros entre componentes

### Negativas

* Mayor complejidad inicial comparado con una arquitectura monolítica simple
* Requiere más archivos y directorios
* Puede haber cierta duplicación de código en las capas de adaptadores
* Curva de aprendizaje para nuevos miembros del equipo

### Neutral

* Requiere disciplina para mantener la estructura a lo largo del tiempo
* Puede necesitar ajustes según evolucionen los requisitos del proyecto

## Alternativas Consideradas

* **Arquitectura MVC tradicional**: Más simple, pero menos escalable y testable.
* **Arquitectura por capas tradicional**: Más rígida y con dificultades para testabilidad.
* **Microservicios**: Excesivamente complejo para el alcance actual del proyecto.
* **Arquitectura basada en eventos**: Demasiado compleja para las necesidades actuales.
* **Arquitectura hexagonal pura**: Más compleja y con más boilerplate que DDD-Light.

## Referencias

* [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)
* [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
* [Tell, Don't Ask Principle](https://martinfowler.com/bliki/TellDontAsk.html)
* [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
* [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
