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
Ver el [diagrama de arquitectura completo](./docs/architecture/architecture-diagram.md) para una visualización detallada de los componentes y sus interacciones.

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