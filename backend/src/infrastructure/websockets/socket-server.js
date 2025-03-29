/**
 * Módulo para gestionar las conexiones WebSocket
 * 
 * Este módulo maneja las conexiones de Socket.IO y proporciona
 * funciones para enviar notificaciones en tiempo real a los clientes
 */
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketServer {
  constructor(httpServer, options = {}) {
    this.io = null;
    this.httpServer = httpServer;
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.userSockets = new Map(); // Mapa de userId -> [socketIds]
    this.eventPublisher = options.eventPublisher;
    
    // Opciones de configuración de Socket.IO
    this.corsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || '*';
  }

  /**
   * Inicializa el servidor de Socket.IO
   */
  initialize() {
    if (this.io) {
      console.warn('Socket.IO ya está inicializado');
      return;
    }

    // Configurar Socket.IO
    this.io = socketIO(this.httpServer, {
      cors: {
        origin: this.corsOrigin,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Middleware de autenticación para Socket.IO
    this.io.use(this.authMiddleware.bind(this));

    // Manejar conexiones
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('✅ Servidor Socket.IO inicializado');
  }

  /**
   * Middleware para autenticar conexiones Socket.IO
   * @param {Object} socket - Socket de conexión
   * @param {Function} next - Función para continuar
   */
  authMiddleware(socket, next) {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.query.token;

      if (!token) {
        return next(new Error('Autenticación requerida'));
      }

      // Verificar token JWT
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Añadir información del usuario al socket
      socket.user = {
        id: decoded.id,
        email: decoded.email
      };
      
      next();
    } catch (error) {
      console.error('Error en autenticación Socket.IO:', error.message);
      next(new Error('Token inválido'));
    }
  }

  /**
   * Maneja una nueva conexión de socket
   * @param {Object} socket - Socket del cliente
   */
  handleConnection(socket) {
    const { id: socketId, user } = socket;
    console.log(`Socket conectado: ${socketId} (Usuario: ${user.id})`);

    // Registrar socket en el mapa de usuarios
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, []);
    }
    this.userSockets.get(user.id).push(socketId);

    // Unir al socket a una sala específica para el usuario
    socket.join(`user:${user.id}`);

    // Enviar mensaje de bienvenida
    socket.emit('welcome', { 
      message: 'Conectado al servidor de TaskMaster',
      userId: user.id
    });

    // Manejar eventos del cliente
    socket.on('ping', (data, callback) => {
      if (callback && typeof callback === 'function') {
        callback({ pong: Date.now(), received: data });
      } else {
        socket.emit('pong', { received: data, time: Date.now() });
      }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socketId}`);
      this.handleDisconnect(socket);
    });
  }

  /**
   * Maneja la desconexión de un socket
   * @param {Object} socket - Socket del cliente
   */
  handleDisconnect(socket) {
    const { id: socketId, user } = socket;
    
    // Eliminar socket del mapa de usuarios
    if (user && user.id && this.userSockets.has(user.id)) {
      const userSocketIds = this.userSockets.get(user.id);
      const updatedSocketIds = userSocketIds.filter(id => id !== socketId);
      
      if (updatedSocketIds.length > 0) {
        this.userSockets.set(user.id, updatedSocketIds);
      } else {
        this.userSockets.delete(user.id);
      }
    }
  }

  /**
   * Envía un evento a un usuario específico
   * @param {string} userId - ID del usuario
   * @param {string} eventName - Nombre del evento
   * @param {Object} data - Datos a enviar
   */
  emitToUser(userId, eventName, data) {
    if (!this.io) {
      console.warn('Socket.IO no inicializado');
      return false;
    }
    
    // Enviar a la sala del usuario
    this.io.to(`user:${userId}`).emit(eventName, data);
    return true;
  }

  /**
   * Envía un evento a todos los usuarios conectados
   * @param {string} eventName - Nombre del evento
   * @param {Object} data - Datos a enviar
   */
  emitToAll(eventName, data) {
    if (!this.io) {
      console.warn('Socket.IO no inicializado');
      return false;
    }
    
    this.io.emit(eventName, data);
    return true;
  }

  /**
   * Cierra todas las conexiones
   */
  async close() {
    if (!this.io) return;
    
    // Enviar evento de cierre a todos los clientes
    this.io.emit('server_shutdown', { 
      message: 'El servidor está cerrando, por favor reconecta en unos momentos',
      timestamp: new Date().toISOString()
    });
    
    // Cierre ordenado
    return new Promise((resolve) => {
      this.io.close(() => {
        console.log('✅ Servidor Socket.IO cerrado');
        this.io = null;
        this.userSockets.clear();
        resolve();
      });
    });
  }
}

module.exports = { SocketServer };
