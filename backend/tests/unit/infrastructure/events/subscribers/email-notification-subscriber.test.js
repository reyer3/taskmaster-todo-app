/**
 * Pruebas unitarias para el suscriptor de notificaciones por email
 *
 * @module tests/unit/infrastructure/events/subscribers/email-notification-subscriber.test
 */

// --- Node/Jest imports ---
// Importa todo lo necesario de @jest/globals
const { describe, it, beforeEach, afterEach, expect } = require('@jest/globals');

// --- Mocking Core Dependencies ---
// Mock del publicador de eventos y su función unsubscribe
const mockUnsubscribe = jest.fn();
const mockEventPublisher = {
  subscribe: jest.fn().mockReturnValue(mockUnsubscribe),
  publish: jest.fn().mockResolvedValue(undefined),
};
// Define los tipos de evento consistentemente
const mockEventTypes = {
  UserEvents: {
    REGISTERED: 'user.registered',
  },
  TaskEvents: {
    CREATED: 'task.created',
    COMPLETED: 'task.completed',
    DUE_SOON: 'task.due_soon',
  },
  AuthEvents: {
    PASSWORD_RESET_REQUESTED: 'auth.password.reset.requested',
    PASSWORD_CHANGED: 'auth.password.changed',
    NEW_LOGIN: 'auth.login.new',
    SUSPICIOUS_LOGIN_ATTEMPT: 'auth.login.suspicious',
  },
};
// Mockea el módulo de eventos para usar los mocks definidos arriba
jest.mock('../../../../../src/infrastructure/events/index', () => ({
  eventPublisher: mockEventPublisher,
  eventTypes: mockEventTypes,
}));

// --- Mock Services and Repositories ---
// Mockea los servicios y repositorios que usa el suscriptor
jest.mock('../../../../../src/services/email.service');
jest.mock('../../../../../src/infrastructure/repositories/user.repository');
jest.mock('../../../../../src/infrastructure/repositories/notification-preference.repository');

// --- Import Mocked Modules & System Under Test ---
// Importa los módulos mockeados y la clase a probar
const emailService = require('../../../../../src/services/email.service');
const { UserRepository } = require('../../../../../src/infrastructure/repositories/user.repository');
const { NotificationPreferenceRepository } = require('../../../../../src/infrastructure/repositories/notification-preference.repository');
// Importa los mocks de eventos y publicador (ya mockeados por jest.mock arriba)
const { eventPublisher, eventTypes } = require('../../../../../src/infrastructure/events');
// Importa la clase del suscriptor
const { EmailNotificationSubscriber } = require('../../../../../src/infrastructure/events/subscribers/email-notification-subscriber');

// --- Test Suite Principal ---
describe('EmailNotificationSubscriber', () => {

  // --- Variables Globales para la Suite ---
  // Define variables que serán usadas en múltiples tests y configuradas en beforeEach
  let subscriber;
  let mockUserRepositoryInstance;
  let mockPreferenceRepositoryInstance;
  let mockUser;
  let mockPreferences;

  // --- Configuración ANTES de CADA Test (beforeEach) ---
  // Este bloque se ejecuta antes de CADA 'it' dentro de este 'describe'
  beforeEach(() => {
    // --- 1. Limpieza de Mocks ---
    // Esencial para evitar que el estado de un test afecte al siguiente
    jest.clearAllMocks();

    // --- 2. Definición de Datos de Prueba ---
    // Define los datos de usuario y preferencias que se usarán por defecto
    mockUser = {
      id: 'user-123',
      email: 'test@example.com', // Asegúrate que el email está definido
      name: 'Test User',
    };
    mockPreferences = {
      id: 'pref-abc',
      userId: 'user-123',
      emailEnabled: true, // Habilitado globalmente por defecto
      // Preferencias específicas (ajusta según necesites en cada test)
      emailWelcome: true,
      emailPasswordReset: true,
      emailTaskReminder: true,
      emailTaskCreated: true,
      emailTaskCompleted: false, // Deshabilitado por defecto para probar esa lógica
      emailPasswordChanged: true,
      emailNewLogin: true,
      emailSuspiciousLogin: true,
      dailyDigest: false,
      weeklyDigest: true,
    };

    // --- 3. Instanciación de Mocks de Repositorios ---
    mockUserRepositoryInstance = new UserRepository();
    mockPreferenceRepositoryInstance = new NotificationPreferenceRepository();

    // --- 4. Configuración del Comportamiento de Mocks ---
    // Define qué devolverán los métodos mockeados por defecto
    mockUserRepositoryInstance.findById.mockResolvedValue(mockUser); // Devuelve el usuario válido por defecto
    mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences); // Devuelve preferencias válidas

    // --- 5. Mockeo de Métodos del Servicio de Email ---
    // Mockea solo los métodos que realmente existen y vas a probar
    emailService.sendWelcomeEmail = jest.fn().mockResolvedValue({ messageId: 'mock-welcome-id' });
    emailService.sendPasswordResetEmail = jest.fn().mockResolvedValue({ messageId: 'mock-reset-id' });
    emailService.sendTaskReminderEmail = jest.fn().mockResolvedValue({ messageId: 'mock-reminder-id' });
    // emailService.sendNotificationDigestEmail = jest.fn().mockResolvedValue({ messageId: 'mock-digest-id' }); // Descomentar si se implementa

    // --- 6. Instanciación del Suscriptor ---
    // Crea una nueva instancia del suscriptor con los mocks configurados
    subscriber = new EmailNotificationSubscriber({
      userRepository: mockUserRepositoryInstance,
      preferenceRepository: mockPreferenceRepositoryInstance,
      emailService,
      enabled: true, // Habilitado por defecto para la mayoría de tests
      eventPublisher: eventPublisher // Pasa el mock global explícitamente si es necesario
    });

    // --- 7. Spies (Opcional, si necesitas espiar métodos internos) ---
    // Puedes espiar métodos del 'subscriber' si necesitas verificar llamadas internas
    // jest.spyOn(subscriber, 'processNotification');
    // jest.spyOn(subscriber, 'addToDigestQueue');
    // jest.spyOn(subscriber, 'markEmailAsSent');
    // jest.spyOn(subscriber, 'hasRecentlySentEmail').mockReturnValue(false); // O mockear su retorno
  });

  // --- Limpieza DESPUÉS de CADA Test (afterEach) ---
  // Este bloque se ejecuta después de CADA 'it'
  afterEach(() => {
    // --- 1. Limpieza del Suscriptor y sus Recursos ---
    if (subscriber) {
      // Limpieza explícita de cachés internas (recomendado para asegurar aislamiento)
      if (subscriber.userCache) subscriber.userCache.clear();
      if (subscriber.preferencesCache) subscriber.preferencesCache.clear();
      if (subscriber.lastEmailSent) subscriber.lastEmailSent.clear();
      if (subscriber.recentEmailsSent) subscriber.recentEmailsSent.clear();
      if (subscriber.digestQueue) subscriber.digestQueue.clear();
      if (subscriber.pendingNotifications) subscriber.pendingNotifications.clear();

      subscriber.dispose(); // Llama a dispose para limpiar intervalos, suscripciones, etc.
    }

    // --- 2. Restaurar Timers ---
    jest.useRealTimers(); // Si usaste jest.useFakeTimers() en algún test

    // --- 3. Restaurar Mocks Globales (Opcional si usas clearAllMocks) ---
    // jest.restoreAllMocks(); // Usualmente no necesario si clearAllMocks está en beforeEach
  });

  // --- Grupo de Tests: Initialization and Disposal ---
  describe('Initialization and Disposal', () => {
    // No necesitas beforeEach/afterEach aquí si el principal es suficiente

    it('should subscribe to relevant events when initialized and enabled', () => {
      subscriber.initialize(); // Usa el subscriber del beforeEach principal

      const expectedSubscriptions = [
        eventTypes.UserEvents.REGISTERED,
        eventTypes.TaskEvents.CREATED,
        eventTypes.TaskEvents.COMPLETED,
        eventTypes.TaskEvents.DUE_SOON,
        eventTypes.AuthEvents.PASSWORD_RESET_REQUESTED,
        eventTypes.AuthEvents.PASSWORD_CHANGED,
        eventTypes.AuthEvents.NEW_LOGIN,
        eventTypes.AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT,
      ];

      expect(eventPublisher.subscribe).toHaveBeenCalledTimes(expectedSubscriptions.length);
      expectedSubscriptions.forEach(eventType => {
        expect(eventPublisher.subscribe).toHaveBeenCalledWith(eventType, expect.any(Function));
      });
      // Verifica también la copia interna si es relevante para tu lógica
      expect(subscriber.unsubscribeFunctions).toHaveLength(expectedSubscriptions.length);
    });

    it('should NOT subscribe to events if initialized when disabled', () => {
      // Crea una instancia específica DESHABILITADA para este test
      const disabledSubscriber = new EmailNotificationSubscriber({
        userRepository: mockUserRepositoryInstance, // Reusa los mocks si aplica
        preferenceRepository: mockPreferenceRepositoryInstance,
        emailService,
        eventPublisher,
        enabled: false // <-- La clave es deshabilitarlo aquí
      });
      disabledSubscriber.initialize();
      expect(eventPublisher.subscribe).not.toHaveBeenCalled();
      disabledSubscriber.dispose(); // Limpia este subscriber específico
    });

    it('should call all unsubscribe functions and clear intervals on dispose', () => {
      subscriber.initialize(); // Inicializa el subscriber principal

      // Guarda una copia de las funciones antes de llamar a dispose
      const unsubscribeFuncs = [...subscriber.unsubscribeFunctions];
      // Asegura que haya funciones para probar (si no, el test no prueba nada)
      expect(unsubscribeFuncs.length).toBeGreaterThan(0);

      // Espía clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      subscriber.dispose(); // Llama a dispose

      // Verifica que cada función de desuscripción original fue llamada
      unsubscribeFuncs.forEach(unsub => {
        // Como el mock global devuelve mockUnsubscribe, verificamos ese mock
        expect(mockUnsubscribe).toHaveBeenCalled();
        // Si tuvieras mocks individuales, verificarías cada uno: expect(unsub).toHaveBeenCalledTimes(1);
      });

      // Verifica que las listas internas se vaciaron
      expect(subscriber.subscriptions).toEqual([]);
      expect(subscriber.unsubscribeFunctions).toEqual([]);

      // Verifica que clearInterval fue llamado (al menos una vez por los intervalos)
      expect(clearIntervalSpy).toHaveBeenCalled();

      // Restaura el spy
      clearIntervalSpy.mockRestore();
    });
  });

  // --- Grupo de Tests: Data Fetching ---
  describe('Data Fetching (getUserById, getPreferences)', () => {
    // No necesitas beforeEach/afterEach aquí si el principal es suficiente

    it('getUserById should fetch user from repository if not in cache', async () => {
      // Asegura que la caché esté vacía para forzar la llamada al repo
      if (subscriber.userCache) subscriber.userCache.clear();

      const user = await subscriber.getUserById(mockUser.id); // Llama al método a probar

      expect(user).toEqual(mockUser); // Verifica que devolvió el usuario esperado
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledTimes(1); // Verifica llamada al repo
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith(mockUser.id); // Verifica argumento
    });

    it('getUserById should return user from cache if available', async () => {
      // Pre-carga la caché
      const cachedUser = { ...mockUser, name: 'Cached User' };
      subscriber.userCache.set(mockUser.id, cachedUser);

      const user = await subscriber.getUserById(mockUser.id); // Llama al método

      expect(user).toEqual(cachedUser); // Verifica que devolvió el usuario de la CACHÉ
      expect(mockUserRepositoryInstance.findById).not.toHaveBeenCalled(); // NO debería llamar al repo
    });

    it('getPreferences should fetch preferences from repository if not in cache', async () => {
      if (subscriber.preferencesCache) subscriber.preferencesCache.clear(); // Limpia caché

      const prefs = await subscriber.getPreferences(mockUser.id);

      expect(prefs).toEqual(mockPreferences);
      expect(mockPreferenceRepositoryInstance.findByUserId).toHaveBeenCalledTimes(1);
      expect(mockPreferenceRepositoryInstance.findByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    it('getPreferences should return preferences from cache if available', async () => {
      const cachedPrefs = { ...mockPreferences, emailEnabled: false };
      subscriber.preferencesCache.set(mockUser.id, cachedPrefs);

      const prefs = await subscriber.getPreferences(mockUser.id);

      expect(prefs).toEqual(cachedPrefs); // Devuelve de la caché
      expect(mockPreferenceRepositoryInstance.findByUserId).not.toHaveBeenCalled(); // No llama al repo
    });

    it('getUserById should return null and log error if repository fails', async () => {
      // Configura el mock del repo para RECHAZAR la promesa
      const dbError = new Error('DB error');
      mockUserRepositoryInstance.findById.mockRejectedValue(dbError);
      // Espía console.error para verificar el log
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const user = await subscriber.getUserById('fail-user'); // Intenta obtener un usuario

      expect(user).toBeNull(); // Espera null como resultado
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error obteniendo usuario fail-user:'), dbError);

      consoleErrorSpy.mockRestore(); // Restaura console.error
    });

    it('getPreferences should return null and log error if repository fails', async () => {
      const dbError = new Error('DB prefs error');
      mockPreferenceRepositoryInstance.findByUserId.mockRejectedValue(dbError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const prefs = await subscriber.getPreferences('fail-prefs');

      expect(prefs).toBeNull();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error obteniendo preferencias para usuario fail-prefs:'), dbError);

      consoleErrorSpy.mockRestore();
    });
  });

  // --- Grupo de Tests: processNotification Logic ---
  describe('processNotification Logic', () => {
    // Este helper puede ser útil si se repite mucho la llamada a processNotification
    // const setupProcessNotificationTest = async (userId, eventType, eventData, immediate = false) => {
    //   return await subscriber.processNotification(userId, eventType, eventData, immediate);
    // };

    // --- Tests para casos donde SÍ se espera envío de email ---
    it('should call sendWelcomeEmail for REGISTERED event if preference allows', async () => {
      mockPreferences.emailWelcome = true; // Asegura que la preferencia está habilitada
      // Reconfigura el mock por si otro test lo cambió
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);

      await subscriber.processNotification(mockUser.id, eventTypes.UserEvents.REGISTERED, { user: mockUser }, true); // Llama a processNotification

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser);
      expect(subscriber.lastEmailSent.has(mockUser.id)).toBe(true); // Verifica que se marcó como enviado
      expect(subscriber.recentEmailsSent.has(`${mockUser.id}-${eventTypes.UserEvents.REGISTERED}`)).toBe(true);
      expect(subscriber.digestQueue.has(mockUser.id)).toBe(false); // No debería ir a digest
    });

    it('should call sendPasswordResetEmail for PASSWORD_RESET_REQUESTED event if preference allows', async () => {
      mockPreferences.emailPasswordReset = true;
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);
      const eventData = { resetToken: 'token123' };

      await subscriber.processNotification(mockUser.id, eventTypes.AuthEvents.PASSWORD_RESET_REQUESTED, eventData, true);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(mockUser, eventData.resetToken);
      expect(subscriber.lastEmailSent.has(mockUser.id)).toBe(true);
    });

    it('should call sendTaskReminderEmail for DUE_SOON event if preference allows', async () => {
      mockPreferences.emailTaskReminder = true;
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);
      const taskData = { id: 'task-due', title: 'Reminder Task', dueDate: new Date() };
      const eventData = { task: taskData, daysLeft: 1 }; // Incluye daysLeft si el handler lo pasa

      // Llama con immediate=false (comportamiento por defecto para due_soon)
      await subscriber.processNotification(mockUser.id, eventTypes.TaskEvents.DUE_SOON, eventData, false);

      expect(emailService.sendTaskReminderEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendTaskReminderEmail).toHaveBeenCalledWith(mockUser, taskData); // Verifica que solo pasa la tarea
      expect(subscriber.lastEmailSent.has(mockUser.id)).toBe(true);
    });

    // --- Tests para casos donde NO se espera envío de email ---

    it('should NOT send email but return true if user/email is missing', async () => {
      mockUserRepositoryInstance.findById.mockResolvedValue(null); // Simula usuario no encontrado
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await subscriber.processNotification('missing-user', eventTypes.UserEvents.REGISTERED, {}, true);

      expect(result).toBe(false); // processNotification devuelve false si no procesa
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('missing-user no encontrado o sin email'));

      consoleWarnSpy.mockRestore();
    });

    it('should NOT send email if globally disabled in preferences', async () => {
      mockPreferences.emailEnabled = false; // Deshabilita globalmente
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await subscriber.processNotification(mockUser.id, eventTypes.UserEvents.REGISTERED, { user: mockUser }, true);

      expect(result).toBe(false); // Devuelve false
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Emails deshabilitados para usuario ${mockUser.id}`));

      consoleLogSpy.mockRestore();
    });

    it('should NOT send email if specifically disabled for the event type', async () => {
      mockPreferences.emailTaskCompleted = false; // Preferencia específica deshabilitada (ya está así por defecto)
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await subscriber.processNotification(mockUser.id, eventTypes.TaskEvents.COMPLETED, { task: {} });

      expect(result).toBe(false); // Devuelve false
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled(); // Verifica cualquier método de email
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`Email para evento ${eventTypes.TaskEvents.COMPLETED} deshabilitado`));

      consoleLogSpy.mockRestore();
    });

    it('should NOT send immediate email but add to digest queue if recently sent', async () => {
      // Configura la preferencia para permitir el email
      mockPreferences.emailTaskReminder = true;
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);
      // Simula que se envió un email hace poco
      subscriber.lastEmailSent.set(mockUser.id, Date.now() - 1000); // Hace 1 segundo

      const taskData = { id: 'task-digest', title: 'Digest Me Task' };
      const eventData = { task: taskData, daysLeft: 0 };
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const addToDigestQueueSpy = jest.spyOn(subscriber, 'addToDigestQueue');

      // Llama con immediate = false (típico para digest)
      const result = await subscriber.processNotification(mockUser.id, eventTypes.TaskEvents.DUE_SOON, eventData, false);

      expect(result).toBe(true); // Devuelve true porque SÍ procesó (encolando)
      expect(emailService.sendTaskReminderEmail).not.toHaveBeenCalled(); // No envió email inmediato
      expect(addToDigestQueueSpy).toHaveBeenCalledTimes(1);
      expect(addToDigestQueueSpy).toHaveBeenCalledWith(
          mockUser.id,
          expect.objectContaining({
            type: eventTypes.TaskEvents.DUE_SOON,
            data: eventData, // Verifica que pasa los datos completos
          })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`añadida a la cola de digestos`));

      consoleLogSpy.mockRestore();
      addToDigestQueueSpy.mockRestore();
    });

    it('should NOT send email if no specific handler exists in sendEmailForEvent', async () => {
      // Usa un evento sin handler específico (ej. TASK_CREATED no llama a ningún emailService.sendX)
      mockPreferences.emailTaskCreated = true; // Habilitado en prefs
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await subscriber.processNotification(mockUser.id, eventTypes.TaskEvents.CREATED, { task: {} });

      // Verifica que ningún método de email fue llamado
      Object.values(emailService).forEach(mockFn => {
        if (jest.isMockFunction(mockFn)) {
          expect(mockFn).not.toHaveBeenCalled();
        }
      });
      // Verifica el log específico de fallback
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(`No hay manejador específico para enviar email del tipo ${eventTypes.TaskEvents.CREATED}`));
      // processNotification debería devolver false porque sendEmailForEvent devolvió false
      expect(result).toBe(false);

      consoleLogSpy.mockRestore();
    });
  });

  // --- Grupo de Tests: Event Handlers ---
  describe('Event Handlers (Integration with processNotification)', () => {
    let processNotificationSpy;

    // Espía processNotification antes de cada test en este grupo
    beforeEach(() => {
      // Inicializa el suscriptor para que se suscriba a los eventos
      subscriber.initialize();
      // Espía el método processNotification para verificar sus llamadas
      processNotificationSpy = jest.spyOn(subscriber, 'processNotification');
    });

    // Restaura el spy después de cada test
    afterEach(() => {
      processNotificationSpy.mockRestore();
    });

    // Helper para encontrar y llamar al handler
    const triggerEventHandler = async (eventType, eventPayload) => {
      const handler = mockEventPublisher.subscribe.mock.calls.find(
          call => call[0] === eventType
      )?.[1];

      expect(handler).toBeDefined(); // Asegura que el handler fue encontrado
      if (handler) {
        await handler({ payload: eventPayload }); // Llama al handler suscrito
      } else {
        throw new Error(`Handler for ${eventType} not found`);
      }
    };

    it('handleUserRegistered should call processNotification correctly', async () => {
      const eventPayload = { userId: mockUser.id, user: mockUser };
      await triggerEventHandler(eventTypes.UserEvents.REGISTERED, eventPayload);

      expect(processNotificationSpy).toHaveBeenCalledTimes(1);
      expect(processNotificationSpy).toHaveBeenCalledWith(
          mockUser.id,
          eventTypes.UserEvents.REGISTERED,
          { user: mockUser },
          true // immediate = true
      );
    });

    it('handlePasswordResetRequested should call processNotification correctly', async () => {
      const eventPayload = { userId: mockUser.id, token: 'reset-token-handler' };
      await triggerEventHandler(eventTypes.AuthEvents.PASSWORD_RESET_REQUESTED, eventPayload);

      expect(processNotificationSpy).toHaveBeenCalledTimes(1);
      expect(processNotificationSpy).toHaveBeenCalledWith(
          mockUser.id,
          eventTypes.AuthEvents.PASSWORD_RESET_REQUESTED,
          { resetToken: eventPayload.token }, // Verifica que transforma 'token' a 'resetToken'
          true // immediate = true
      );
    });

    it('handleTaskDueSoon should call processNotification correctly', async () => {
      const task = { id: 'task-handler-due', title: 'Due Soon Handler', dueDate: new Date() };
      const eventPayload = { userId: mockUser.id, task: task, daysLeft: 1 }; // Incluye daysLeft
      await triggerEventHandler(eventTypes.TaskEvents.DUE_SOON, eventPayload);

      expect(processNotificationSpy).toHaveBeenCalledTimes(1);
      expect(processNotificationSpy).toHaveBeenCalledWith(
          mockUser.id,
          eventTypes.TaskEvents.DUE_SOON,
          // Verifica que pasa tanto task como daysLeft si están en el payload
          { task: task, daysLeft: eventPayload.daysLeft },
          false // immediate = false
      );
    });

    it('handleTaskCreated should call processNotification correctly', async () => {
      const task = { id: 'task-created-handler', title: 'Created Task'};
      const eventPayload = { userId: mockUser.id, task: task };
      await triggerEventHandler(eventTypes.TaskEvents.CREATED, eventPayload);

      expect(processNotificationSpy).toHaveBeenCalledTimes(1);
      expect(processNotificationSpy).toHaveBeenCalledWith(
          mockUser.id,
          eventTypes.TaskEvents.CREATED,
          { task: task },
          false // immediate = false (valor por defecto si no se pasa)
      );
    });

    it('handleSuspiciousLoginAttempt should call processNotification correctly', async () => {
      const attempt = { ip: '1.2.3.4', time: new Date() };
      const eventPayload = { userId: mockUser.id, attempt: attempt };
      await triggerEventHandler(eventTypes.AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT, eventPayload);

      expect(processNotificationSpy).toHaveBeenCalledTimes(1);
      expect(processNotificationSpy).toHaveBeenCalledWith(
          mockUser.id,
          eventTypes.AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT,
          { attempt: attempt }, // Pasa el objeto attempt
          true // immediate = true
      );
    });

  });

  // --- Grupo de Tests: Cleanup Caches ---
  describe.only('cleanupCaches', () => {
    beforeEach(() => {
      // Usa timers falsos para controlar el tiempo fácilmente
      jest.useFakeTimers();
      // Asegúrate que las TTLs estén definidas (ya están en el constructor)
      // subscriber.CACHE_TTL_USER = 30 * 60 * 1000;
      // subscriber.RECENT_SENT_TTL = 60 * 60 * 1000;
    });

    afterEach(() => {
      // Vuelve a timers reales después de cada test en este grupo
      jest.useRealTimers();
    });

    it('should remove expired entries from userCache and recentEmailsSent', () => {
      // --- Arrange ---
      const userOld = 'user-old';
      const userNew = 'user-new';
      const eventOld = 'event.old';
      const eventNew = 'event.new';
      const ttl = subscriber.RECENT_SENT_TTL; // Obtén la TTL (e.g., 3600000)

      // 1. Establece el tiempo inicial falso
      const initialTime = jest.now(); // = 0

      // 2. Simula el envío del email "viejo" en el tiempo inicial
      const oldTimestamp = initialTime;
      subscriber.recentEmailsSent.set(`${userOld}-${eventOld}`, oldTimestamp);
      // console.log(`[TEST Corrected] Set OLD timestamp: ${oldTimestamp}`);

      // 3. Avanza el tiempo HASTA la mitad de la TTL
      const halfTtlAdvance = ttl / 2;
      // console.log(`[TEST Corrected] Advancing time by half TTL: ${halfTtlAdvance}`);
      jest.advanceTimersByTime(halfTtlAdvance);

      // 4. Simula el envío del email "nuevo" AHORA (a la mitad de la TTL)
      const newTimestamp = jest.now(); // = initialTime + halfTtlAdvance
      subscriber.recentEmailsSent.set(`${userNew}-${eventNew}`, newTimestamp);
      // console.log(`[TEST Corrected] Set NEW timestamp: ${newTimestamp}`);

      // 5. Avanza el tiempo OTRA VEZ, lo suficiente para que el viejo expire, pero no el nuevo.
      //    Necesitamos avanzar al menos otros (ttl / 2) + un poquito más (e.g., 2000ms)
      //    para superar la TTL total desde el timestamp 'old'.
      const finalAdvance = (ttl / 2) + 2000;
      // console.log(`[TEST Corrected] Advancing time finally by: ${finalAdvance}`);
      jest.advanceTimersByTime(finalAdvance);

      // --- Act ---
      const currentTimeForCleanup = jest.now(); // Tiempo falso final
      // console.log(`[TEST Corrected] Final fake time: ${currentTimeForCleanup}`);
      // console.log(`[TEST Corrected] Calling cleanupCaches(${currentTimeForCleanup})`);

      // Llama a cleanupCaches pasando el tiempo falso final
      subscriber.cleanupCaches(currentTimeForCleanup);

      // --- Assert ---
      // Verifica que la entrada vieja (timestamp=0) fue borrada.
      // Edad calculada: currentTimeForCleanup - oldTimestamp = (initialTime + ttl + 2000) - initialTime = ttl + 2000.
      // ttl + 2000 > ttl. Correcto.
      // console.log(`[TEST Corrected] Asserting ${userOld}-${eventOld} is false`);
      expect(subscriber.recentEmailsSent.has(`${userOld}-${eventOld}`)).toBe(false);

      // Verifica que la entrada nueva (timestamp = initialTime + ttl/2) NO fue borrada.
      // Edad calculada: currentTimeForCleanup - newTimestamp = (initialTime + ttl + 2000) - (initialTime + ttl/2) = (ttl/2) + 2000.
      // (ttl/2) + 2000 > ttl. Falso. Correcto.
      // console.log(`[TEST Corrected] Asserting ${userNew}-${eventNew} is true`);
      expect(subscriber.recentEmailsSent.has(`${userNew}-${eventNew}`)).toBe(true); // <-- ESTA DEBERÍA PASAR AHORA

      // (Opcional: Verifica userCache si lo populaste)
      // expect(subscriber.userCache.has(userNew)).toBe(true);
    });
  });

  // --- Grupo de Tests: Digest Sending (Comentado si no implementado) ---
  /*
  describe('sendPendingDigests', () => {
    // beforeEach específico si necesitas preparar digestos
    beforeEach(() => {
      // Mockea sendNotificationDigestEmail si existe
      // emailService.sendNotificationDigestEmail = jest.fn().mockResolvedValue({ messageId: 'digest-id'});
    });

    it('should call sendNotificationDigestEmail for users with pending items', async () => {
      // Añade notificaciones a la cola
      const notification1 = { type: 'task.created', data: { task: { title: 'Digest Task 1' } }, timestamp: Date.now() };
      subscriber.addToDigestQueue(mockUser.id, notification1);
      mockPreferences.emailEnabled = true;
      mockPreferenceRepositoryInstance.findByUserId.mockResolvedValue(mockPreferences);

      await subscriber.sendPendingDigests(); // Llama al método

      // Adapta esta aserción al método real que envíe el digesto
      // expect(emailService.sendNotificationDigestEmail).toHaveBeenCalledTimes(1);
      // expect(emailService.sendNotificationDigestEmail).toHaveBeenCalledWith(mockUser, [notification1]);
      expect(subscriber.digestQueue.get(mockUser.id)).toEqual([]); // Espera que se vacíe la cola
      expect(subscriber.pendingNotifications.get(mockUser.id)).toEqual([]); // Y la copia de prueba
    });

    // ... más tests para digests (usuario deshabilitado, error al enviar, etc.) ...
  });
  */

}); // --- Fin del Test Suite Principal ---