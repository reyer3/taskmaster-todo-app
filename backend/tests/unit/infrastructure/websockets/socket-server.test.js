/**
 * Pruebas unitarias para SocketServer
 */
const jwt = require('jsonwebtoken');

// Mock para Socket.IO (debe estar antes de importar cualquier módulo que lo use)
const mockToEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockToEmit }));
const mockSocketIoInstance = {
  on: jest.fn(),
  use: jest.fn(),
  close: jest.fn().mockImplementation(cb => cb && cb()),
  emit: jest.fn(),
  to: mockTo
};
const mockSocketIo = jest.fn().mockReturnValue(mockSocketIoInstance);
jest.mock('socket.io', () => mockSocketIo);

// Ahora importamos nuestros módulos
const { SocketServer } = require('../../../../src/infrastructure/websockets/socket-server');
const { AppError } = require('../../../../src/utils/errors/app-error');

// Constantes para pruebas
const TEST_SECRET = 'test-jwt-secret';
const TEST_ORIGIN = 'http://localhost:3000';
const TEST_USER_ID = 'user123';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_SOCKET_ID = 'socket-id-123';
const TEST_TOKEN = jwt.sign({ id: TEST_USER_ID, email: TEST_USER_EMAIL }, TEST_SECRET);

describe('SocketServer', () => {
  // Variables de prueba
  let socketServer;
  let mockHttpServer;
  let mockSocket;
  let mockNext;

  // Configuración común para los tests
  beforeEach(() => {
    // Limpiamos todos los mocks para comenzar fresco
    jest.clearAllMocks();
    
    // Mock para el servidor HTTP
    mockHttpServer = {};
    
    // Mock para un socket individual
    mockSocket = {
      id: TEST_SOCKET_ID,
      handshake: {
        auth: {
          token: TEST_TOKEN
        },
        query: {
          token: TEST_TOKEN
        }
      },
      join: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn()
    };
    
    // Mock para la función next del middleware
    mockNext = jest.fn();
    
    // Inicializamos un nuevo SocketServer para cada test
    socketServer = new SocketServer(mockHttpServer, {
      jwtSecret: TEST_SECRET,
      corsOrigin: TEST_ORIGIN
    });
    
    // Inicializar el mapa de usuarios (ya que en el código real se usa un Map)
    socketServer.userSockets = new Map();
  });
  
  describe('initialize', () => {
    it('debería configurar Socket.IO con las opciones correctas', () => {
      // Inicializamos el servidor
      socketServer.initialize();
      
      // Verificamos que se llamó al constructor con los parámetros correctos
      expect(mockSocketIo).toHaveBeenCalledWith(mockHttpServer, {
        cors: {
          origin: TEST_ORIGIN,
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
      
      // Verificamos que se configuró el middleware de autenticación
      expect(mockSocketIoInstance.use).toHaveBeenCalledWith(expect.any(Function));
      
      // Verificamos que se configuró el manejador de conexiones
      expect(mockSocketIoInstance.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
    
    it('no debería inicializar si ya está inicializado', () => {
      // Inicializamos una primera vez
      socketServer.initialize();
      
      // Limpiamos los mocks
      jest.clearAllMocks();
      
      // Intentamos inicializar otra vez
      socketServer.initialize();
      
      // Verificamos que no se llamó a ningún método
      expect(mockSocketIo).not.toHaveBeenCalled();
    });
  });
  
  describe('authMiddleware', () => {
    it('debería autenticar con un token válido', () => {
      // Verificamos que el token es válido
      mockSocket.handshake.auth.token = TEST_TOKEN;
      
      // Simulamos la llamada al middleware de autenticación
      socketServer.authMiddleware(mockSocket, mockNext);
      
      // Verificamos que se llamó a next sin errores
      expect(mockNext).toHaveBeenCalledWith();
      
      // Verificamos que se asignó el usuario al socket
      expect(mockSocket.user).toEqual({
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL
      });
    });
    
    it('debería rechazar con un token ausente', () => {
      // Modificamos el socket para que no tenga token
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      
      // Simulamos la llamada al middleware
      socketServer.authMiddleware(mockSocket, mockNext);
      
      // Verificamos que se llamó a next con un error
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Autenticación requerida');
    });
    
    it('debería rechazar con un token inválido', () => {
      // Modificamos el socket para que tenga un token inválido
      mockSocket.handshake.auth.token = 'invalid-token';
      
      // Simulamos la llamada al middleware
      socketServer.authMiddleware(mockSocket, mockNext);
      
      // Verificamos que se llamó a next con un error
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Token inválido');
    });
  });
  
  describe('handleConnection', () => {
    it('debería registrar el socket y unirse a la sala del usuario', () => {
      // Asignamos un usuario al socket (simulando que pasó la autenticación)
      mockSocket.user = {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL
      };
      
      // Simulamos la conexión
      socketServer.handleConnection(mockSocket);
      
      // Verificamos que el socket se unió a la sala correcta
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${TEST_USER_ID}`);
      
      // Verificamos que se registró el socket en el mapa de usuarios
      expect(socketServer.userSockets.has(TEST_USER_ID)).toBe(true);
      expect(socketServer.userSockets.get(TEST_USER_ID)).toContain(TEST_SOCKET_ID);
      
      // Verificamos que se configuró el manejador de desconexión
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      
      // Verificamos que se emitió el mensaje de bienvenida
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'welcome',
        expect.objectContaining({
          message: expect.any(String),
          userId: TEST_USER_ID
        })
      );
    });
    
    it('debería manejar múltiples conexiones del mismo usuario', () => {
      // Configuramos el primer socket
      const mockSocket1 = {
        ...mockSocket,
        id: 'socket-1',
        user: { id: TEST_USER_ID, email: TEST_USER_EMAIL },
        join: jest.fn(),
        on: jest.fn(),
        emit: jest.fn()
      };
      
      // Configuramos el segundo socket
      const mockSocket2 = {
        ...mockSocket,
        id: 'socket-2',
        user: { id: TEST_USER_ID, email: TEST_USER_EMAIL },
        join: jest.fn(),
        on: jest.fn(),
        emit: jest.fn()
      };
      
      // Simulamos la primera conexión
      socketServer.handleConnection(mockSocket1);
      
      // Simulamos la segunda conexión
      socketServer.handleConnection(mockSocket2);
      
      // Verificamos que ambos sockets se registraron para el mismo usuario
      expect(socketServer.userSockets.get(TEST_USER_ID)).toEqual(['socket-1', 'socket-2']);
    });
  });
  
  describe('handleDisconnect', () => {
    it('debería eliminar el socket del mapa de usuarios', () => {
      // Configuramos el usuario y socket en el servidor
      mockSocket.user = {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL
      };
      
      // Añadimos manualmente sockets al mapa de usuarios
      socketServer.userSockets.set(TEST_USER_ID, [TEST_SOCKET_ID, 'other-socket-id']);
      
      // Simulamos la conexión para registrar el manejador de desconexión
      socketServer.handleConnection(mockSocket);
      
      // Capturamos y ejecutamos directamente la función de desconexión (no el evento)
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      
      // Ejecutamos manualmente el handler de desconexión
      disconnectHandler();
      
      // Verificamos que se eliminó el socket correcto
      const remainingSockets = socketServer.userSockets.get(TEST_USER_ID);
      expect(remainingSockets).toEqual(['other-socket-id']);
    });
    
    it('debería eliminar la entrada del usuario si no quedan sockets', () => {
      // Configuramos el usuario y socket en el servidor
      mockSocket.user = {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL
      };
      
      // Añadimos manualmente un socket al mapa de usuarios
      socketServer.userSockets.set(TEST_USER_ID, [TEST_SOCKET_ID]);
      
      // Simulamos la conexión para registrar el manejador de desconexión
      socketServer.handleConnection(mockSocket);
      
      // Capturamos y ejecutamos directamente la función de desconexión
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      
      // Ejecutamos manualmente el handler
      disconnectHandler();
      
      // Verificamos que se eliminó la entrada completa
      expect(socketServer.userSockets.has(TEST_USER_ID)).toBe(false);
    });
  });
  
  describe('emitToUser', () => {
    it('debería emitir evento a la sala del usuario', () => {
      // Inicializamos Socket.IO
      socketServer.initialize();
      
      // Preparamos el mensaje y datos
      const eventName = 'test-event';
      const eventData = { message: 'Hello' };
      
      // Emitimos el evento
      socketServer.emitToUser(TEST_USER_ID, eventName, eventData);
      
      // Verificamos que se utilizó el método correcto
      expect(mockSocketIoInstance.to).toHaveBeenCalledWith(`user:${TEST_USER_ID}`);
      expect(mockToEmit).toHaveBeenCalledWith(eventName, eventData);
    });
    
    it('debería devolver false si Socket.IO no está inicializado', () => {
      // Establecemos io a null para simular que no está inicializado
      socketServer.io = null;
      
      // Intentamos emitir un evento
      const result = socketServer.emitToUser(TEST_USER_ID, 'test-event', {});
      
      // Verificamos que devuelve false
      expect(result).toBe(false);
    });
  });
  
  describe('emitToAll', () => {
    it('debería emitir evento a todos los clientes', () => {
      // Inicializamos Socket.IO
      socketServer.initialize();
      
      // Preparamos el mensaje y datos
      const eventName = 'broadcast-event';
      const eventData = { message: 'Broadcast message' };
      
      // Emitimos el evento
      socketServer.emitToAll(eventName, eventData);
      
      // Verificamos que se utilizó el método correcto
      expect(mockSocketIoInstance.emit).toHaveBeenCalledWith(eventName, eventData);
    });
    
    it('debería devolver false si Socket.IO no está inicializado', () => {
      // Establecemos io a null para simular que no está inicializado
      socketServer.io = null;
      
      // Intentamos emitir un evento
      const result = socketServer.emitToAll('broadcast-event', {});
      
      // Verificamos que devuelve false
      expect(result).toBe(false);
    });
  });
  
  describe('close', () => {
    it('debería cerrar el servidor y limpiar los recursos', () => {
      // Inicializamos Socket.IO
      socketServer.initialize();
      
      // Configuramos algunos datos de usuario
      socketServer.userSockets.set(TEST_USER_ID, [TEST_SOCKET_ID]);
      
      // Cerramos el servidor
      socketServer.close();
      
      // Verificamos que se llamó al método correcto
      expect(mockSocketIoInstance.close).toHaveBeenCalled();
      
      // Verificamos que se limpiaron los datos
      expect(socketServer.io).toBeNull();
      expect(socketServer.userSockets.size).toBe(0);
    });
    
    it('no debería hacer nada si Socket.IO no está inicializado', () => {
      // Establecemos io a null para simular que no está inicializado
      socketServer.io = null;
      
      // Intentamos cerrar el servidor
      socketServer.close();
      
      // Verificamos que no ocurrió ningún error
      expect(true).toBe(true); // Simplemente verificamos que no hubo excepciones
    });
  });
});