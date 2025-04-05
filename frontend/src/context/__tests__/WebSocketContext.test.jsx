/**
 * Pruebas unitarias para WebSocketContext
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import WebSocketProvider, { useWebSocket } from '../WebSocketContext';
import { useAuth } from '../AuthContext';

// Mock de los hooks y dependencias
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock para socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: false,
    io: {
      opts: {
        query: {}
      }
    }
  };

  // Retornar una función que devuelve el socket mock
  return jest.fn(() => mockSocket);
});

// Componente de prueba que consume el hook useWebSocket
const TestComponent = () => {
  const { connected, connect, disconnect, socket, sendEvent } = useWebSocket();
  return (
    <div>
      <div data-testid="connected">{String(connected)}</div>
      <button data-testid="connect-btn" onClick={connect}>Conectar</button>
      <button data-testid="disconnect-btn" onClick={disconnect}>Desconectar</button>
      <button data-testid="send-event-btn" onClick={() => sendEvent('test-event', { data: 'test' })}>Enviar Evento</button>
    </div>
  );
};

describe('WebSocketContext', () => {
  let mockSocket;
  let mockAuthData;
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Obtener referencia al socket mock
    const socketIoClient = require('socket.io-client');
    mockSocket = socketIoClient();
    
    // Configurar mock de autenticación
    mockAuthData = {
      token: 'mock-token',
      user: { id: 'user123', email: 'user@example.com' },
      isAuthenticated: true,
      loading: false
    };
    
    useAuth.mockReturnValue(mockAuthData);
  });
  
  afterEach(() => {
    // Limpiar timers si hay
    jest.useRealTimers();
  });
  
  it('debería proveer el contexto con valores iniciales correctos', () => {
    // Renderizar el componente con el proveedor
    const { getByTestId } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Verificar estado inicial
    expect(getByTestId('connected').textContent).toBe('false');
  });
  
  it('debería conectarse automáticamente al renderizar cuando el usuario está autenticado', () => {
    // Usar mock timers para manejar useEffect async
    jest.useFakeTimers();
    
    // Renderizar el componente
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Avanzar timers para permitir que el efecto se ejecute
    act(() => {
      jest.runAllTimers();
    });
    
    // Verificar que se intentó conectar
    expect(mockSocket.connect).toHaveBeenCalled();
  });
  
  it('no debería conectarse automáticamente si el usuario no está autenticado', () => {
    // Modificar el mock para usuario no autenticado
    useAuth.mockReturnValue({
      ...mockAuthData,
      isAuthenticated: false
    });
    
    // Usar mock timers
    jest.useFakeTimers();
    
    // Renderizar el componente
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Avanzar timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Verificar que no se intentó conectar
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });
  
  it('debería configurar eventos correctamente al conectarse', () => {
    // Renderizar el componente
    const { getByTestId } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Simular una conexión manual
    act(() => {
      getByTestId('connect-btn').click();
    });
    
    // Verificar que se configuraron los listeners
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('welcome', expect.any(Function));
  });
  
  it('debería desconectarse correctamente', () => {
    // Renderizar el componente
    const { getByTestId } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Simular desconexión
    act(() => {
      getByTestId('disconnect-btn').click();
    });
    
    // Verificar que se llamó a disconnect
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
  
  it('debería enviar eventos correctamente', () => {
    // Renderizar el componente
    const { getByTestId } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Simular el envío de un evento
    act(() => {
      getByTestId('send-event-btn').click();
    });
    
    // Verificar que se llamó a emit con los parámetros correctos
    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });
  
  it('debería actualizar el estado de conexión cuando Socket.IO conecta', async () => {
    // Renderizar el componente
    const { getByTestId } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Obtener el callback de conexión
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    
    // Inicialmente desconectado
    expect(getByTestId('connected').textContent).toBe('false');
    
    // Simular evento de conexión exitosa
    await act(async () => {
      connectCallback();
    });
    
    // Ahora debería estar conectado
    await waitFor(() => {
      expect(getByTestId('connected').textContent).toBe('true');
    });
  });
  
  it('debería actualizar el estado de conexión cuando Socket.IO desconecta', async () => {
    // Renderizar el componente con estado inicial conectado
    const { getByTestId } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Obtener callbacks
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    
    // Simular conexión primero
    await act(async () => {
      connectCallback();
    });
    
    // Verificar que está conectado
    await waitFor(() => {
      expect(getByTestId('connected').textContent).toBe('true');
    });
    
    // Simular desconexión
    await act(async () => {
      disconnectCallback('io server disconnect');
    });
    
    // Ahora debería estar desconectado
    await waitFor(() => {
      expect(getByTestId('connected').textContent).toBe('false');
    });
  });
  
  it('debería intentar reconectarse automáticamente después de un error', async () => {
    // Usar timers falsos para manejar reconexión
    jest.useFakeTimers();
    
    // Renderizar el componente
    render(
      <WebSocketProvider reconnectInterval={500}>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Obtener el callback de error
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    
    // Simular error de conexión
    await act(async () => {
      errorCallback(new Error('Connection failed'));
      jest.advanceTimersByTime(1000); // Avanzar más allá del intervalo de reconexión
    });
    
    // Debería haber intentado reconectar
    expect(mockSocket.connect).toHaveBeenCalledTimes(2); // Una vez al inicio y otra después del error
  });
  
  it('debería limpiar eventos y desconectarse al desmontar', () => {
    // Renderizar el componente
    const { unmount } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );
    
    // Desmontar el componente
    unmount();
    
    // Verificar que se limpiaron los listeners y se desconectó
    expect(mockSocket.off).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
}); 