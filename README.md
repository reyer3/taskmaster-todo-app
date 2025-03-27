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

## 👥 Equipo de Desarrollo

- **Ricardo Emanuel Reyes Ramirez** - Líder de Proyecto / Frontend
- **Miguel Eduardo Watson Villacorta** - Backend / ORM
- **Jose Eriberto Pinares Mejia** - UI/UX / Integración con IA
- **Carolina Del Rubio Gutierrez Paniagua** - Arquitectura / Manejo de Excepciones
- **Older Victor Doroteo Abad** - QA / Documentación

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
