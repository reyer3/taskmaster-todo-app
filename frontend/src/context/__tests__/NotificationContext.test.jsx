/**
 * Pruebas unitarias para NotificationContext
 */
import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import NotificationProvider, { useNotifications } from '../NotificationContext';
import { useWebSocket } from '../WebSocketContext';
import { useAuth } from '../AuthContext';
import notificationService from '../../services/notificationService';

// Mock de los hooks y servicios
jest.mock('../WebSocketContext', () => ({
  useWebSocket: jest.fn()
}));

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../services/notificationService', () => ({
  getNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  updatePreferences: jest.fn(),
  getPreferences: jest.fn()
}));

// Componente de prueba que consume el hook useNotifications
const TestComponent = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    emailEnabled,
    setEmailEnabled
  } = useNotifications();
  
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id} data-testid={`notification-${notification.id}`}>
            {notification.message}
            <button 
              data-testid={`read-btn-${notification.id}`}
              onClick={() => markAsRead(notification.id)}
            >
              Marcar como leída
            </button>
            <button 
              data-testid={`delete-btn-${notification.id}`}
              onClick={() => deleteNotification(notification.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
      <button data-testid="mark-all-read" onClick={markAllAsRead}>
        Marcar todas como leídas
      </button>
      <div>
        <label htmlFor="email-toggle">Notificaciones por email</label>
        <input
          id="email-toggle"
          type="checkbox"
          data-testid="email-toggle"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
        />
      </div>
    </div>
  );
};

describe('NotificationContext', () => {
  let mockSocketHook;
  let mockAuthHook;
  let mockEventHandlers = {};
  
  const mockNotifications = [
    { id: '1', message: 'Notificación 1', read: false, createdAt: '2023-04-05T10:00:00Z' },
    { id: '2', message: 'Notificación 2', read: true, createdAt: '2023-04-04T09:00:00Z' },
    { id: '3', message: 'Notificación 3', read: false, createdAt: '2023-04-03T08:00:00Z' }
  ];
  
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Mock de eventHandlers para simular eventos websocket
    mockEventHandlers = {};
    
    // Configurar mock para el hook de WebSocket
    mockSocketHook = {
      connected: true,
      socket: {
        on: jest.fn((event, callback) => {
          mockEventHandlers[event] = callback;
        }),
        off: jest.fn()
      },
      sendEvent: jest.fn()
    };
    useWebSocket.mockReturnValue(mockSocketHook);
    
    // Configurar mock para el hook de Auth
    mockAuthHook = {
      isAuthenticated: true,
      user: { id: 'user123' }
    };
    useAuth.mockReturnValue(mockAuthHook);
    
    // Configurar respuesta del servicio de notificaciones
    notificationService.getNotifications.mockResolvedValue({ 
      data: mockNotifications 
    });
    
    notificationService.getPreferences.mockResolvedValue({
      data: { emailEnabled: true }
    });
    
    notificationService.markAsRead.mockResolvedValue({
      data: { success: true }
    });
    
    notificationService.markAllAsRead.mockResolvedValue({
      data: { success: true }
    });
    
    notificationService.deleteNotification.mockResolvedValue({
      data: { success: true }
    });
    
    notificationService.updatePreferences.mockResolvedValue({
      data: { emailEnabled: false }
    });
  });
  
  it('debería cargar notificaciones al montar', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Inicialmente en estado de carga
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // Esperar a que se completen las llamadas asíncronas
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verificar que se llamó al servicio
    expect(notificationService.getNotifications).toHaveBeenCalled();
    
    // Verificar que se mostraron las notificaciones
    expect(screen.getByTestId('notifications-count').textContent).toBe('3');
    expect(screen.getByTestId('unread-count').textContent).toBe('2');
  });
  
  it('debería conectar a eventos de websocket para notificaciones en tiempo real', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verificar que se registraron los manejadores de eventos
    expect(mockSocketHook.socket.on).toHaveBeenCalledWith('notification:new', expect.any(Function));
    expect(mockSocketHook.socket.on).toHaveBeenCalledWith('notification:updated', expect.any(Function));
    expect(mockSocketHook.socket.on).toHaveBeenCalledWith('notification:deleted', expect.any(Function));
  });
  
  it('debería agregar una nueva notificación recibida por websocket', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Simular una nueva notificación por websocket
    const newNotification = { 
      id: '4', 
      message: 'Nueva notificación', 
      read: false,
      createdAt: '2023-04-06T11:00:00Z'
    };
    
    await act(async () => {
      mockEventHandlers['notification:new'](newNotification);
    });
    
    // Verificar que se agregó la notificación
    expect(screen.getByTestId('notifications-count').textContent).toBe('4');
    expect(screen.getByTestId('unread-count').textContent).toBe('3');
    expect(screen.getByTestId('notification-4')).toBeInTheDocument();
  });
  
  it('debería marcar una notificación como leída', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Marcar una notificación como leída
    await act(async () => {
      fireEvent.click(screen.getByTestId('read-btn-1'));
    });
    
    // Verificar que se llamó al servicio
    expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
    
    // Verificar que se actualizó el contador
    expect(screen.getByTestId('unread-count').textContent).toBe('1');
  });
  
  it('debería marcar todas las notificaciones como leídas', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Marcar todas como leídas
    await act(async () => {
      fireEvent.click(screen.getByTestId('mark-all-read'));
    });
    
    // Verificar que se llamó al servicio
    expect(notificationService.markAllAsRead).toHaveBeenCalled();
    
    // Verificar que se actualizó el contador
    expect(screen.getByTestId('unread-count').textContent).toBe('0');
  });
  
  it('debería eliminar una notificación', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Eliminar una notificación
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-btn-2'));
    });
    
    // Verificar que se llamó al servicio
    expect(notificationService.deleteNotification).toHaveBeenCalledWith('2');
    
    // Verificar que se eliminó la notificación
    expect(screen.getByTestId('notifications-count').textContent).toBe('2');
    expect(screen.queryByTestId('notification-2')).not.toBeInTheDocument();
  });
  
  it('debería cambiar la preferencia de email', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verificar estado inicial
    expect(screen.getByTestId('email-toggle')).toBeChecked();
    
    // Cambiar la preferencia
    await act(async () => {
      fireEvent.click(screen.getByTestId('email-toggle'));
    });
    
    // Verificar que se llamó al servicio
    expect(notificationService.updatePreferences).toHaveBeenCalledWith({ emailEnabled: false });
    
    // Verificar que se actualizó el estado
    expect(screen.getByTestId('email-toggle')).not.toBeChecked();
  });
  
  it('debería manejar errores al cargar notificaciones', async () => {
    // Configurar error en el servicio
    notificationService.getNotifications.mockRejectedValue(new Error('Error al cargar'));
    
    // Espiar console.error
    jest.spyOn(console, 'error').mockImplementation();
    
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete la carga con error
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verificar que se manejó el error
    expect(console.error).toHaveBeenCalled();
    expect(screen.getByTestId('notifications-count').textContent).toBe('0');
    
    // Restaurar console.error
    console.error.mockRestore();
  });
  
  it('no debería cargar notificaciones si el usuario no está autenticado', async () => {
    // Configurar usuario no autenticado
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });
    
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Verificar que no se llamó al servicio
    expect(notificationService.getNotifications).not.toHaveBeenCalled();
    
    // Verificar que no hay notificaciones
    expect(screen.getByTestId('notifications-count').textContent).toBe('0');
  });
  
  it('debería actualizar una notificación recibida por websocket', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Simular actualización de notificación por websocket
    const updatedNotification = { 
      id: '1', 
      read: true
    };
    
    await act(async () => {
      mockEventHandlers['notification:updated'](updatedNotification);
    });
    
    // Verificar que se actualizó el contador
    expect(screen.getByTestId('unread-count').textContent).toBe('1');
  });
  
  it('debería eliminar una notificación recibida por websocket', async () => {
    // Renderizar el componente
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Esperar a que se complete el montaje
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Simular eliminación de notificación por websocket
    await act(async () => {
      mockEventHandlers['notification:deleted']({ id: '3' });
    });
    
    // Verificar que se eliminó la notificación
    expect(screen.getByTestId('notifications-count').textContent).toBe('2');
    expect(screen.queryByTestId('notification-3')).not.toBeInTheDocument();
    
    // Verificar que se actualizó el contador
    expect(screen.getByTestId('unread-count').textContent).toBe('1');
  });
  
  it('debería desconectarse de eventos al desmontar', () => {
    // Renderizar el componente
    const { unmount } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Desmontar el componente
    unmount();
    
    // Verificar que se desconectaron los eventos
    expect(mockSocketHook.socket.off).toHaveBeenCalledWith('notification:new');
    expect(mockSocketHook.socket.off).toHaveBeenCalledWith('notification:updated');
    expect(mockSocketHook.socket.off).toHaveBeenCalledWith('notification:deleted');
  });
}); 