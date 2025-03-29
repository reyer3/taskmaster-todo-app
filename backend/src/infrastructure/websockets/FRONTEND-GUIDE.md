# Guía de Integración de WebSockets para el Frontend

Esta guía explica cómo conectarse al sistema de notificaciones en tiempo real desde el frontend de la aplicación TaskMaster.

## Requisitos

Para implementar la integración con WebSockets, necesitarás incluir la biblioteca Socket.IO cliente en tu proyecto de frontend:

```bash
# NPM
npm install socket.io-client

# Yarn
yarn add socket.io-client
```

## Conexión Básica

A continuación se muestra cómo establecer una conexión básica al servidor WebSocket:

```javascript
import { io } from 'socket.io-client';

// Función para conectar al servidor de WebSockets
const connectToWebSocket = (token) => {
  // Crear la conexión con Socket.IO pasando el token JWT
  const socket = io('http://localhost:4000', {
    auth: {
      token: token // Token JWT obtenido durante el login
    }
  });

  // Manejar eventos de conexión
  socket.on('connect', () => {
    console.log('Conectado al servidor de notificaciones en tiempo real');
  });

  socket.on('disconnect', () => {
    console.log('Desconectado del servidor de notificaciones en tiempo real');
  });

  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error.message);
  });

  // Evento de bienvenida
  socket.on('welcome', (data) => {
    console.log('Mensaje de bienvenida:', data.message);
  });

  return socket;
};

// Exportar la función
export default connectToWebSocket;
```

## Escuchar Notificaciones

Después de conectarte, debes suscribirte a los eventos que te interesan:

```javascript
// Suscribirse a notificaciones de tareas
socket.on('task:created', (data) => {
  console.log('Nueva tarea creada:', data.title);
  // Aquí puedes actualizar el estado de tu aplicación
  // o mostrar una notificación al usuario
});

socket.on('task:updated', (data) => {
  console.log('Tarea actualizada:', data);
});

socket.on('task:completed', (data) => {
  console.log('¡Tarea completada!', data.title);
  // Mostrar alguna celebración o notificación
});

socket.on('task:due_soon', (data) => {
  console.log(`Tienes ${data.count} tareas pendientes próximamente`);
  // Mostrar recordatorio al usuario
});
```

## Integración con React

Ejemplo de un hook personalizado para WebSockets en React:

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useWebSocket = (authToken) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!authToken) return;

    // Crear conexión
    const socketIo = io('http://localhost:4000', {
      auth: { token: authToken }
    });

    // Manejar eventos de conexión
    socketIo.on('connect', () => {
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      setIsConnected(false);
    });

    // Manejar notificaciones
    const handleNotification = (eventName) => (data) => {
      const newNotification = {
        id: Date.now(),
        type: eventName,
        data,
        read: false,
        timestamp: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    };

    // Suscribirse a eventos
    socketIo.on('task:created', handleNotification('task:created'));
    socketIo.on('task:updated', handleNotification('task:updated'));
    socketIo.on('task:completed', handleNotification('task:completed'));
    socketIo.on('task:due_soon', handleNotification('task:due_soon'));

    // Guardar la referencia al socket
    setSocket(socketIo);

    // Limpieza al desmontar
    return () => {
      socketIo.disconnect();
    };
  }, [authToken]);

  // Función para marcar notificaciones como leídas
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    );
  };

  // Función para marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  return {
    socket,
    isConnected,
    notifications,
    markAsRead,
    markAllAsRead,
    unreadCount: notifications.filter(n => !n.read).length
  };
};
```

## Uso del Hook en un Componente

```jsx
import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';

const NotificationCenter = () => {
  const { token } = useAuth();
  const { 
    isConnected, 
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead 
  } = useWebSocket(token);

  return (
    <div className="notification-center">
      <div className="status">
        Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>
      
      <div className="header">
        <h3>Notificaciones ({unreadCount})</h3>
        <button onClick={markAllAsRead}>Marcar todas como leídas</button>
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <p>No hay notificaciones</p>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification ${notification.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-title">
                {getNotificationTitle(notification)}
              </div>
              <div className="notification-body">
                {getNotificationBody(notification)}
              </div>
              <div className="notification-time">
                {formatTime(notification.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Funciones auxiliares
const getNotificationTitle = (notification) => {
  switch (notification.type) {
    case 'task:created':
      return '✅ Nueva tarea';
    case 'task:completed':
      return '🎉 Tarea completada';
    case 'task:due_soon':
      return '⏰ Tareas pendientes';
    default:
      return 'Notificación';
  }
};

const getNotificationBody = (notification) => {
  switch (notification.type) {
    case 'task:created':
      return `Se ha creado la tarea: ${notification.data.title}`;
    case 'task:completed':
      return `Has completado la tarea: ${notification.data.title}`;
    case 'task:due_soon':
      return `Tienes ${notification.data.count} tareas pendientes próximamente`;
    default:
      return JSON.stringify(notification.data);
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

export default NotificationCenter;
```

## Lista Completa de Eventos

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `task:created` | Nueva tarea creada | `{ taskId, title, priority, dueDate }` |
| `task:updated` | Tarea actualizada | `{ taskId, changes, message }` |
| `task:completed` | Tarea marcada como completada | `{ taskId, title, message }` |
| `task:deleted` | Tarea eliminada | `{ taskId, title, message }` |
| `task:due_soon` | Tareas próximas a vencer | `{ count, tasks, message, daysWindow }` |
| `auth:login_success` | Inicio de sesión exitoso | `{ message, timestamp }` |
| `server_shutdown` | El servidor está cerrando | `{ message, timestamp }` |

## Buenas Prácticas

1. **Reconexión automática**: Socket.IO se reconecta automáticamente, pero puedes personalizar este comportamiento.

2. **Manejo de errores**: Siempre escucha el evento `connect_error` para depurar problemas de conexión.

3. **Separación de responsabilidades**: Utiliza un hook o servicio dedicado para manejar las WebSockets.

4. **Limpieza**: Siempre desconecta el socket cuando el componente se desmonta para evitar fugas de memoria.

5. **Tokens JWT**: Actualiza el token en la conexión WebSocket cuando el token de acceso se renueve.
