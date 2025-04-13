/**
 * Pruebas unitarias para el modelo de dominio Task
 */
const { Task } = require('../../../../src/domain/tasks/task.model');

describe('Task Model', () => {
  describe('Constructor', () => {
    it('debería crear una instancia de Task con valores por defecto', () => {
      // Datos mínimos requeridos
      const taskData = {
        id: 'task123',
        title: 'Tarea de prueba',
        userId: 'user123'
      };
      
      // Crear instancia
      const task = new Task(taskData);
      
      // Verificaciones
      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('task123');
      expect(task.title).toBe('Tarea de prueba');
      expect(task.userId).toBe('user123');
      
      // Verificar valores por defecto
      expect(task.description).toBe('');
      expect(task.completed).toBe(false);
      expect(task.category).toBe('personal');
      expect(task.priority).toBe('none');
      expect(task.dueDate).toBeNull();
    });

    it('debería crear una instancia de Task con todos los valores proporcionados', () => {
      // Datos completos
      const dueDate = new Date('2025-12-31');
      const taskData = {
        id: 'task123',
        title: 'Tarea completa',
        description: 'Descripción detallada',
        userId: 'user123',
        completed: true,
        category: 'trabajo',
        priority: 'high',
        dueDate: dueDate
      };
      
      // Crear instancia
      const task = new Task(taskData);
      
      // Verificaciones
      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('task123');
      expect(task.title).toBe('Tarea completa');
      expect(task.description).toBe('Descripción detallada');
      expect(task.userId).toBe('user123');
      expect(task.completed).toBe(true);
      expect(task.category).toBe('trabajo');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toEqual(dueDate);
    });

    it('debería permitir crear una tarea con fecha de vencimiento para hoy', () => {
      // Crear una fecha para hoy
      const today = new Date();
      
      // Asegurarse de que solo usamos la fecha sin la hora (como en la validación real)
      const todayWithoutTime = new Date(today.toISOString().split('T')[0]);
      
      // Datos de la tarea con la fecha de hoy
      const taskData = {
        id: 'task123',
        title: 'Tarea para hoy',
        userId: 'user123',
        dueDate: todayWithoutTime
      };
      
      // No debería lanzar error al crear la tarea
      expect(() => new Task(taskData)).not.toThrow();
      
      // Crear la tarea y verificar que la fecha se estableció correctamente
      const task = new Task(taskData);
      expect(task.dueDate).toEqual(todayWithoutTime);
    });

    it('debería validar que title no esté vacío', () => {
      // Datos con título vacío
      const taskData = {
        id: 'task123',
        title: '',
        userId: 'user123'
      };
      
      // Verificar que lanza error
      expect(() => new Task(taskData)).toThrow('El título de la tarea no puede estar vacío');
    });

    it('debería validar que id no esté vacío', () => {
      // Datos con id vacío
      const taskData = {
        id: '',
        title: 'Tarea de prueba',
        userId: 'user123'
      };
      
      // Verificar que lanza error
      expect(() => new Task(taskData)).toThrow('El ID de la tarea no puede estar vacío');
    });

    it('debería validar que userId no esté vacío', () => {
      // Datos con userId vacío
      const taskData = {
        id: 'task123',
        title: 'Tarea de prueba',
        userId: ''
      };
      
      // Verificar que lanza error
      expect(() => new Task(taskData)).toThrow('El ID de usuario no puede estar vacío');
    });
  });

  describe('Métodos de actualización', () => {
    let task;

    beforeEach(() => {
      // Crear una instancia fresca para cada prueba
      task = new Task({
        id: 'task123',
        title: 'Tarea original',
        description: 'Descripción original',
        userId: 'user123',
        completed: false,
        category: 'personal',
        priority: 'none'
      });
    });

    describe('updateTitle', () => {
      it('debería actualizar el título', () => {
        task.updateTitle('Nuevo título');
        expect(task.title).toBe('Nuevo título');
      });

      it('debería validar que el título no esté vacío', () => {
        expect(() => task.updateTitle('')).toThrow('El título de la tarea no puede estar vacío');
        expect(task.title).toBe('Tarea original'); // No debería cambiar
      });
    });

    describe('updateDescription', () => {
      it('debería actualizar la descripción', () => {
        task.updateDescription('Nueva descripción');
        expect(task.description).toBe('Nueva descripción');
      });

      it('debería permitir descripción vacía', () => {
        task.updateDescription('');
        expect(task.description).toBe('');
      });
    });

    describe('updateDueDate', () => {
      it('debería actualizar la fecha de vencimiento', () => {
        const newDate = new Date('2025-12-31');
        task.updateDueDate(newDate);
        expect(task.dueDate).toEqual(newDate);
      });

      it('debería permitir establecer fecha de vencimiento a null', () => {
        // Primero establecer una fecha
        task.updateDueDate(new Date());
        // Luego establecer a null
        task.updateDueDate(null);
        expect(task.dueDate).toBeNull();
      });

      it('debería validar que la fecha sea válida', () => {
        expect(() => task.updateDueDate('not-a-date')).toThrow('La fecha de vencimiento debe ser una fecha válida o null');
        // No debería cambiar
        expect(task.dueDate).toBeNull();
      });

      it('debería permitir establecer la fecha de vencimiento para el día actual', () => {
        // Crear una fecha para hoy
        const today = new Date();
        
        // Asegurarse de que solo usamos la fecha sin la hora (como en la validación real)
        const todayWithoutTime = new Date(today.toISOString().split('T')[0]);
        
        // No debería lanzar error
        expect(() => task.updateDueDate(todayWithoutTime)).not.toThrow();
        
        // Verificar que la fecha se estableció correctamente
        expect(task.dueDate).toEqual(todayWithoutTime);
      });
    });

    describe('updatePriority', () => {
      it('debería actualizar la prioridad', () => {
        task.updatePriority('high');
        expect(task.priority).toBe('high');
      });

      it('debería validar que la prioridad sea válida', () => {
        expect(() => task.updatePriority('invalid')).toThrow('Prioridad inválida');
        // No debería cambiar
        expect(task.priority).toBe('none');
      });

      it('debería aceptar todas las prioridades válidas', () => {
        const validPriorities = ['none', 'low', 'medium', 'high'];
        
        for (const priority of validPriorities) {
          task.updatePriority(priority);
          expect(task.priority).toBe(priority);
        }
      });
    });

    describe('updateCategory', () => {
      it('debería actualizar la categoría', () => {
        task.updateCategory('trabajo');
        expect(task.category).toBe('trabajo');
      });

      it('debería validar que la categoría sea válida', () => {
        expect(() => task.updateCategory('invalid')).toThrow('Categoría inválida');
        // No debería cambiar
        expect(task.category).toBe('personal');
      });

      it('debería aceptar todas las categorías válidas', () => {
        const validCategories = ['personal', 'trabajo', 'estudio', 'salud', 'finanzas', 'otros'];
        
        for (const category of validCategories) {
          task.updateCategory(category);
          expect(task.category).toBe(category);
        }
      });
    });

    describe('markAsCompleted', () => {
      it('debería marcar la tarea como completada', () => {
        task.markAsCompleted();
        expect(task.completed).toBe(true);
      });

      it('no debería hacer nada si ya está completada', () => {
        task.markAsCompleted();
        expect(task.completed).toBe(true);
        
        // Llamar de nuevo no debería cambiar nada
        task.markAsCompleted();
        expect(task.completed).toBe(true);
      });
    });

    describe('markAsIncomplete', () => {
      it('debería marcar la tarea como incompleta', () => {
        // Primero marcar como completada
        task.markAsCompleted();
        expect(task.completed).toBe(true);
        
        // Luego marcar como incompleta
        task.markAsIncomplete();
        expect(task.completed).toBe(false);
      });

      it('no debería hacer nada si ya está incompleta', () => {
        expect(task.completed).toBe(false);
        
        // Llamar no debería cambiar nada
        task.markAsIncomplete();
        expect(task.completed).toBe(false);
      });
    });
  });

  describe('toJSON', () => {
    it('debería convertir la tarea a un objeto plano', () => {
      const dueDate = new Date('2025-12-31');
      const task = new Task({
        id: 'task123',
        title: 'Tarea para JSON',
        description: 'Descripción de la tarea',
        userId: 'user123',
        completed: true,
        category: 'trabajo',
        priority: 'high',
        dueDate: dueDate
      });
      
      const json = task.toJSON();
      
      // Verificaciones
      expect(json).toEqual({
        id: 'task123',
        title: 'Tarea para JSON',
        description: 'Descripción de la tarea',
        userId: 'user123',
        completed: true,
        category: 'trabajo',
        priority: 'high',
        dueDate: dueDate
      });
      
      // Verificar que es un objeto plano, no una instancia de Task
      expect(json).not.toBeInstanceOf(Task);
      expect(json.constructor).toBe(Object);
    });

    describe('Creación con fecha del día actual', () => {
      it('debería permitir crear una tarea con fecha de vencimiento para hoy', () => {
        // Crear una fecha para hoy
        const today = new Date();
        
        // Crear datos de la tarea con la fecha de hoy
        const taskData = {
          id: 'task123',
          title: 'Tarea para hoy',
          userId: 'user123',
          dueDate: today
        };
        
        // No debería lanzar error al crear la tarea
        expect(() => new Task(taskData)).not.toThrow();
        
        // Crear la tarea y verificar que la fecha se estableció correctamente
        const task = new Task(taskData);
        expect(task.dueDate).toEqual(today);
      });
    });
  });
});
