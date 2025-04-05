import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { useForm } from 'react-hook-form';

/**
 * Componente de página de registro
 * Muestra un formulario para crear una nueva cuenta
 */
const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
    setError
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Ver valor actual de password para validación
  const password = watch('password');

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { 
        type: 'manual', 
        message: 'Las contraseñas no coinciden' 
      });
      return;
    }

    try {
      setIsLoading(true);
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password
      });
      addToast({
        type: 'success',
        title: '¡Cuenta creada!',
        message: 'Tu registro se ha completado exitosamente'
      });
    } catch (error) {
      console.error('Error en registro:', error);
      addToast({
        type: 'error',
        title: 'Error de registro',
        message: error.message || 'No se pudo crear la cuenta, intenta de nuevo'
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">Crear cuenta</h1>
          <p className="text-gray-600 dark:text-dark-text-secondary mt-1">Regístrate para usar TaskMaster</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Nombre input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Nombre completo"
              className={`
                w-full px-4 py-2 rounded-md border 
                bg-white dark:bg-dark-bg-tertiary
                dark:text-dark-text-primary
                focus:ring-2 focus:ring-primary focus:ring-opacity-50 
                focus:border-primary focus:outline-none transition-colors
                ${errors.name ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border'}
              `}
              {...register('name', { 
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className={`
                w-full px-4 py-2 rounded-md border 
                bg-white dark:bg-dark-bg-tertiary
                dark:text-dark-text-primary
                focus:ring-2 focus:ring-primary focus:ring-opacity-50 
                focus:border-primary focus:outline-none transition-colors
                ${errors.email ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border'}
              `}
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="********"
              className={`
                w-full px-4 py-2 rounded-md border 
                bg-white dark:bg-dark-bg-tertiary
                dark:text-dark-text-primary
                focus:ring-2 focus:ring-primary focus:ring-opacity-50 
                focus:border-primary focus:outline-none transition-colors
                ${errors.password ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border'}
              `}
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

          {/* Confirm Password input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="********"
              className={`
                w-full px-4 py-2 rounded-md border 
                bg-white dark:bg-dark-bg-tertiary
                dark:text-dark-text-primary
                focus:ring-2 focus:ring-primary focus:ring-opacity-50 
                focus:border-primary focus:outline-none transition-colors
                ${errors.confirmPassword ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border'}
              `}
              {...register('confirmPassword', { 
                required: 'Confirma tu contraseña',
                validate: value => value === password || 'Las contraseñas no coinciden'
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Términos y condiciones */}
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 mt-1 text-primary focus:ring-primary border-gray-300 dark:border-dark-border rounded"
              {...register('terms', { 
                required: 'Debes aceptar los términos y condiciones' 
              })}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-dark-text-secondary">
              Acepto los{' '}
              <Link to="/terms" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacy" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                política de privacidad
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.terms.message}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-6"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando cuenta...
              </>
            ) : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 