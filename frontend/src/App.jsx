import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './features/auth/components/LoginPage';
import RegisterPage from './features/auth/components/RegisterPage';
import TasksPage from './features/tasks/components/TasksPage';
import NotFoundPage from './components/NotFoundPage';
import { useToast } from './context/ToastContext';
import Toast from './components/common/Toast';

/**
 * Componente principal de la aplicación
 * Configura las rutas y la navegación protegida
 */
function App() {
  const { isAuthenticated, user } = useAuth();
  const { toasts, removeToast } = useToast();

  /**
   * Componente de ruta protegida que redirecciona si no hay autenticación
   */
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Rutas públicas */}
          <Route path="login" element={
            isAuthenticated ? <Navigate to="/tasks" replace /> : <LoginPage />
          } />
          <Route path="register" element={
            isAuthenticated ? <Navigate to="/tasks" replace /> : <RegisterPage />
          } />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/tasks" replace />
            </ProtectedRoute>
          } />
          <Route path="tasks" element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } />
          
          {/* Ruta para no encontrado */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {/* Sistema de notificaciones */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </>
  );
}

export default App;
