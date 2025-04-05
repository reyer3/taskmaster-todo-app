# Diagrama de Arquitectura TaskMaster

Este diagrama muestra la arquitectura completa de la aplicación TaskMaster, incluyendo las capas de Frontend, Backend, y la infraestructura subyacente.

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

## Explicación del Diagrama

El diagrama muestra las siguientes capas y componentes de la aplicación:

### Frontend
- **Interfaz de Usuario**: La aplicación React que interactúa con el usuario
- **Contexts**: Gestión de estado global con React Context (Auth, Tasks, Toast)
- **Servicios API**: Capa de comunicación con el backend usando Axios

### Backend (Arquitectura DDD-Light)
- **API Layer**: Controladores que reciben las peticiones HTTP
- **Services Layer**: Lógica de negocio y orquestación de operaciones
- **Domain Layer**: Modelos de dominio y reglas de negocio
- **Infrastructure Layer**: Comunicación con bases de datos, eventos y otros servicios externos

### DevOps & Workflow
- Herramientas y documentación para gestionar el ciclo de vida del desarrollo

## Flujo de Datos
Las flechas representan el flujo de datos y las dependencias entre los diferentes componentes de la aplicación.
