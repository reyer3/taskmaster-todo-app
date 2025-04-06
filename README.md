# TaskMaster - Aplicación de Gestión de Tareas

Aplicación de gestión de tareas con autenticación de usuarios desarrollada con metodologías ágiles y asistencia de IA generativa.

## 🌟 Características

- **Autenticación de usuarios**: Registro, login y gestión de sesiones
- **Gestión de tareas personales**: Crear, editar, eliminar y marcar como completadas
- **Filtrado y categorización**: Filtrar por estado, categoría y búsqueda
- **Interfaz responsiva**: Diseño adaptable a múltiples dispositivos
- **Manejo robusto de excepciones**: Sistema global de errores y feedback
- **Persistencia de datos**: ORM Prisma con PostgreSQL

## 🚀 Tecnologías

### Frontend
- React
- Tailwind CSS
- React Router
- Axios
- Context API

### Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT (JSON Web Tokens)

### DevOps
- Git + GitHub
- Vercel (Frontend)
- Railway (Backend y BD)
- GitHub Actions (CI/CD)

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura **DDD-Light** (Domain-Driven Design simplificado) que incorpora elementos de la **Arquitectura Limpia** (Clean Architecture) y el principio **Tell, Don't Ask**. Para más detalles, consulta nuestro [ADR-0002](./docs/architecture/decisions/0002-ddd-light-architecture.md).

### Diagrama de Arquitectura

```mermaid
flowchart TD

    subgraph "Frontend"
        F1("Interfaz de Usuario (React App)"):::frontend
        F2("Contexts (Auth,Tasks,Toast)"):::frontend
        F3("Servicios API (Axios & Token)"):::frontend
    end

    subgraph "Backend"
        subgraph "API Layer"
            B1("Auth Controller"):::backend
            B2("Task Controller"):::backend
            B3("Notification Controller"):::backend
            B4("Realtime Controller"):::backend
        end
        subgraph "Services Layer"
            S1("Auth Service"):::service
            S2("Task Service"):::service
            S3("Notification Service"):::service
            S4("Email Service"):::service
        end
        subgraph "Domain Layer"
            D1("User Model"):::domain
            D2("Task Model"):::domain
            D3("Notification Models"):::domain
        end
        subgraph "Infrastructure Layer"
            I1("Database (Prisma & PostgreSQL)"):::infra
            I2("Repositories"):::infra
            I3("Events (Publisher/Logger)"):::infra
            I4("Subscribers (Email & Notification)"):::infra
            I5("Websockets"):::infra
            I6("Middlewares"):::infra
        end
    end

    subgraph "DevOps & Workflow"
        DEV1("Git Flow Scripts"):::devops
        DEV2("Workflow & Architecture Docs"):::devops
    end

    %% Frontend interactions
    F1 --> F2
    F1 --> F3
    F3 -->|"RESTCalls"| B1
    F3 -->|"RESTCalls"| B2
    F3 -->|"RESTCalls"| B3
    F3 -->|"RESTCalls"| B4

    %% Backend Layer interactions
    B1 -->|"calls"| S1
    B2 -->|"calls"| S2
    B3 -->|"calls"| S3
    B4 -->|"calls"| S4

    S1 -->|"business"| D1
    S2 -->|"business"| D2
    S3 -->|"business"| D3
    S3 -->|"triggers"| I3
    S4 -->|"triggers"| I4

    I2 -->|"persistsTo"| I1
    I3 -->|"notifies"| I5

    %% DevOps connections (indicative)
    DEV1 -->|"integrates"| F1
    DEV1 -->|"integrates"| B1
    DEV2 -->|"documents"| B1

    %% Styles
    classDef frontend fill:#fce1f5,stroke:#b85fc8,stroke-width:2px;
    classDef backend fill:#e0f7fa,stroke:#00acc1,stroke-width:2px;
    classDef service fill:#e8f5e9,stroke:#43a047,stroke-width:2px;
    classDef domain fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;
    classDef infra fill:#fff9c4,stroke:#f9a825,stroke-width:2px;
    classDef devops fill:#ffe0b2,stroke:#fb8c00,stroke-width:2px;
```


## 🌿 Flujo de Trabajo Git (Git Flow)

Utilizamos **Git Flow** como estrategia de branching, siguiendo nuestra [decisión arquitectónica documentada en ADR-0001](./docs/architecture/decisions/0001-use-gitflow-for-development-workflow.md).

### Ramas principales
- `main`: Código de producción estable
- `develop`: Rama de integración para desarrollo

### Tipos de ramas
- **Feature**: Para nuevas características (`feature/nombre-caracteristica`)
- **Release**: Preparación para versiones (`release/x.y.z`)
- **Hotfix**: Correcciones urgentes en producción (`hotfix/x.y.z`)

### Script auxiliar para Git Flow

El proyecto incluye un script Bash para facilitar el trabajo con Git Flow:

```bash
# Ver ayuda y comandos disponibles
./scripts/git-flow-helper.sh help

# Iniciar una nueva característica
./scripts/git-flow-helper.sh feature start nombre-caracteristica

# Finalizar una característica
./scripts/git-flow-helper.sh feature finish nombre-caracteristica

# Iniciar una versión
./scripts/git-flow-helper.sh release start x.y.z

# Finalizar una versión
./scripts/git-flow-helper.sh release finish x.y.z

# Ver estado actual de Git Flow
./scripts/git-flow-helper.sh status
```

### Proceso para contribuir
1. Crea una rama desde `develop`: `git checkout -b feature/nombre-caracteristica develop`
2. Desarrolla y haz commits de tu característica
3. Envía un Pull Request a `develop`
4. Después de revisión, se fusionará a `develop`
5. Las versiones estables se fusionan a `main` mediante ramas `release/`

### Protección de ramas
Las ramas `main` y `develop` están protegidas:
- Requieren revisión de pull requests antes de fusionar
- No se permite push directo a estas ramas
- Los CI checks deben pasar antes de fusionar

## 📋 Requisitos previos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x (o acceso a una BD en Railway)

## 🛠️ Instalación

### Clonar el repositorio
```bash
git clone https://github.com/reyer3/taskmaster-todo-app.git
cd taskmaster-todo-app
```

### Instalar dependencias del backend
```bash
cd backend
npm install
```

### Configurar variables de entorno
Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:
```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/taskmaster"
JWT_SECRET="tu_secreto_jwt"
PORT=4000
```

### Ejecutar migraciones de Prisma
```bash
npx prisma migrate dev
```

### Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

### Configurar variables de entorno del frontend
Crea un archivo `.env` en la carpeta `frontend`:
```
VITE_API_URL=http://localhost:4000/api
```

## 🚀 Ejecución

### Iniciar el backend
```bash
cd backend
npm run dev
```

### Iniciar el frontend
```bash
cd frontend
npm run dev
```

## 📊 Metodología Ágil

Este proyecto se desarrolló utilizando la metodología Scrum adaptada a un sprint de una semana:

- **Sprint planning**: Documentado en el acta de kickoff
- **Daily standups**: Reuniones diarias de 15 minutos
- **Tablero Kanban**: Implementado con GitHub Projects
- **Sprint review**: Demostración de funcionalidades al final del sprint
- **Retrospectiva**: Análisis de lo aprendido y mejoras futuras

## 🤖 Uso de IA Generativa

Este proyecto utiliza inteligencia artificial generativa (Claude, ChatGPT) para:

- Generación de componentes UI
- Optimización de consultas ORM
- Implementación de manejo de excepciones
- Refactorización de código

La documentación detallada del uso de IA se encuentra en el archivo [ai-contributions.md](./ai-contributions.md).

## 🧪 Testing

```bash
# Ejecutar tests del backend
cd backend
npm test

# Ejecutar tests del frontend
cd frontend
npm test
```

## 📐 Decisiones Arquitectónicas

Mantenemos un registro de decisiones arquitectónicas (ADRs) para documentar las decisiones importantes que afectan la arquitectura del proyecto:

- [ADR-0001](./docs/architecture/decisions/0001-use-gitflow-for-development-workflow.md) - Uso de Git Flow para el flujo de trabajo de desarrollo
- [ADR-0002](./docs/architecture/decisions/0002-ddd-light-architecture.md) - Implementación de arquitectura DDD-Light

## 👥 Equipo de Desarrollo

- **Ricardo Emanuel Reyes Ramirez** - Líder de Proyecto / Frontend
- **Miguel Eduardo Watson Villacorta** - Backend / ORM
- **Jose Eriberto Pinares Mejia** - UI/UX / Integración con IA
- **Carolina Del Rubio Gutierrez Paniagua** - Arquitectura / Manejo de Excepciones
- **Older Victor Doroteo Abad** - QA / Documentación

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.