import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CalendarPage from '../CalendarPage';
import { ToastProvider } from '../../../../context/ToastContext';

// Mock de servicios
vi.mock('../../../tasks/services/tasks.service', () => ({
  createTask: vi.fn(() => Promise.resolve({ id: 'new-task', title: 'Nueva tarea' })),
  updateTask: vi.fn(() => Promise.resolve({ id: '1', title: 'Tarea actualizada' })),
  deleteTask: vi.fn(() => Promise.resolve({}))
}));

vi.mock('../../services/calendar.service', () => ({
  getTasksByDateRange: vi.fn(() => Promise.resolve([])),
  organizeTasksByDate: vi.fn(() => ({})),
  getCalendarDays: vi.fn(() => []),
  isSameDay: vi.fn(() => false)
}));

// Mock de componentes
vi.mock('../MonthCalendar', () => ({
  default: vi.fn(({ onDateSelect }) => (
    <div data-testid="month-calendar">
      <button onClick={() => onDateSelect(new Date())}>Seleccionar fecha</button>
    </div>
  ))
}));

vi.mock('../WeekCalendar', () => ({
  default: vi.fn(() => <div data-testid="week-calendar" />)
}));

vi.mock('../DayView', () => ({
  default: vi.fn(() => <div data-testid="day-view" />)
}));

vi.mock('../../../../components/common/Modal', () => ({
  default: vi.fn(({ children, title, onClose }) => (
    <div data-testid="modal" aria-label={title}>
      <button onClick={onClose}>Cerrar</button>
      {children}
    </div>
  ))
}));

// Suite de pruebas
describe('CalendarPage Component', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ToastProvider>
          <CalendarPage />
        </ToastProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza el componente correctamente', async () => {
    renderComponent();
    
    expect(screen.getByText('Calendario de Tareas')).toBeInTheDocument();
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Mes')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Día')).toBeInTheDocument();
  });

  test('cambia entre diferentes vistas de calendario', async () => {
    renderComponent();
    
    // Por defecto debería mostrar la vista mensual
    expect(screen.getByTestId('month-calendar')).toBeInTheDocument();
    
    // Cambiar a vista semanal
    fireEvent.click(screen.getByText('Semana'));
    expect(screen.getByTestId('week-calendar')).toBeInTheDocument();
    
    // Cambiar a vista diaria
    fireEvent.click(screen.getByText('Día'));
    expect(screen.getByTestId('day-view')).toBeInTheDocument();
    
    // Volver a vista mensual
    fireEvent.click(screen.getByText('Mes'));
    expect(screen.getByTestId('month-calendar')).toBeInTheDocument();
  });

  test('navega a la fecha "Hoy" cuando se hace clic en el botón', async () => {
    renderComponent();
    const today = new Date();
    
    // Simular clic en "Hoy"
    fireEvent.click(screen.getByText('Hoy'));
    
    // Verificar que se muestre el mes actual
    const currentMonth = today.toLocaleString('es-ES', { month: 'long' });
    expect(screen.getByText(new RegExp(currentMonth, 'i'))).toBeInTheDocument();
  });
}); 