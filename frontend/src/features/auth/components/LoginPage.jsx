import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { useForm } from 'react-hook-form';

/**
 * Componente de página de login
 * Muestra un formulario para iniciar sesión y autenticarse
 */
const LoginPage = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password, rememberMe);
      addToast({
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Has iniciado sesión correctamente'
      });
    } catch (error) {
      console.error('Error en login:', error);
      addToast({
        type: 'error',
        title: 'Error de autenticación',
        message: error.message || 'No se pudo iniciar sesión, intenta de nuevo'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 py-8 md:py-12 w-full max-w-md mx-auto">
      <div className="w-full card p-6 md:p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">Iniciar sesión</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary mt-1">Accede a tu cuenta de TaskMaster</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`
                w-full px-4 py-2 rounded-md border 
                bg-white dark:bg-dark-bg-tertiary
                dark:text-dark-text-primary
                focus:ring-2 focus:ring-primary focus:ring-opacity-50 
                focus:border-primary focus:outline-none transition-colors
                ${errors.email ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border'}
              `}
              placeholder="tu@correo.com"
              {...register('email', { 
                required: 'El correo es obligatorio',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Ingresa un correo válido'
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                Contraseña
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`
                w-full px-4 py-2 rounded-md border 
                bg-white dark:bg-dark-bg-tertiary
                dark:text-dark-text-primary
                focus:ring-2 focus:ring-primary focus:ring-opacity-50 
                focus:border-primary focus:outline-none transition-colors
                ${errors.password ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border'}
              `}
              placeholder="********"
              {...register('password', { 
                required: 'La contraseña es obligatoria',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres'
                }
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-dark-border rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-dark-text-secondary">
              Recordarme
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 