import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './features/auth/components/LoginPage';
import RegisterPage from './features/auth/components/RegisterPage';
import TasksPage from './features/tasks/components/TasksPage';
import DashboardPage from './features/dashboard/components/DashboardPage';
import CalendarPage from './features/calendar/components/CalendarPage';
import NotFoundPage from './components/NotFoundPage';
import { useToast } from './context/ToastContext';
import Toast from './components/common/Toast';
import Debug from './components/Debug'; // Importar componente de depuración
import DarkModeDemo from './components/DarkModeDemo'; // Importar componente de demo para temas
import { useTheme } from './hooks/useTheme';
import useFavicon from './hooks/useFavicon'; // Importar hook para manejar el favicon

/**
 * Componente principal de la aplicación
 * Configura las rutas y la navegación protegida
 */
function App() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toasts, removeToast } = useToast();
  const { resolvedTheme } = useTheme(); // Obtener tema actual
  useFavicon(resolvedTheme); // Aplicar favicon según el tema
  
  /**
   * Componente de ruta protegida que redirecciona si no hay autenticación
   */
  const ProtectedRoute = ({ children }) => {
    console.log('ProtectedRoute evaluando:', { isAuthenticated, isLoading });
    
    // Esperar a que termine la carga antes de decidir redireccionar
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>;
    }
    
    if (!isAuthenticated) {
      console.log('No autenticado, redireccionando a /login');
      return <Navigate to="/login" replace />;
    }
    
    console.log('Usuario autenticado, mostrando contenido protegido');
    return children;
  };

  console.log('App renderizando. Estado de autenticación:', { isAuthenticated, isLoading });

  // Solo mostrar diagnóstico en desarrollo
  const showDebug = import.meta.env.DEV === true;

  return (
    <>
      {showDebug && <Debug />}
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Rutas públicas */}
          <Route path="login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />
          <Route path="register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="tasks" element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } />
          <Route path="calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          
          {/* Ruta para demo del tema oscuro */}
          <Route path="/theme-demo" element={<DarkModeDemo />} />
          
          {/* Ruta para no encontrado */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {/* Sistema de notificaciones */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-end max-w-full">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </>
  );
}

export default App;
