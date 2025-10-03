// Patrón Observer para manejo de eventos y notificaciones

// Clase base Observer
class Observer {
  update(data) {
    throw new Error('El método update debe ser implementado');
  }
}

// Clase base Subject (Observable)
class Subject {
  constructor() {
    this.observers = new Set();
  }

  subscribe(observer) {
    if (!(observer instanceof Observer)) {
      throw new Error('El observer debe extender la clase Observer');
    }
    this.observers.add(observer);
    return () => this.unsubscribe(observer); // Retorna función de cleanup
  }

  unsubscribe(observer) {
    this.observers.delete(observer);
  }

  notify(data) {
    this.observers.forEach(observer => {
      try {
        observer.update(data);
      } catch (error) {
        console.error('Error en observer:', error);
      }
    });
  }

  clear() {
    this.observers.clear();
  }

  get observerCount() {
    return this.observers.size;
  }
}

// Sistema de notificaciones usando Observer
class NotificationSystem extends Subject {
  constructor() {
    super();
    this.notifications = [];
    this.maxNotifications = 50;
  }

  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    
    // Mantener solo las últimas notificaciones
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.notify({
      type: 'NOTIFICATION_ADDED',
      notification: newNotification,
      notifications: this.notifications
    });

    return newNotification.id;
  }

  removeNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const removed = this.notifications.splice(index, 1)[0];
      this.notify({
        type: 'NOTIFICATION_REMOVED',
        notification: removed,
        notifications: this.notifications
      });
      return true;
    }
    return false;
  }

  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.notify({
        type: 'NOTIFICATION_READ',
        notification,
        notifications: this.notifications
      });
      return true;
    }
    return false;
  }

  markAllAsRead() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      this.notifications.forEach(n => n.read = true);
      this.notify({
        type: 'ALL_NOTIFICATIONS_READ',
        notifications: this.notifications
      });
    }
    return unreadCount;
  }

  clearAll() {
    const count = this.notifications.length;
    this.notifications = [];
    this.notify({
      type: 'ALL_NOTIFICATIONS_CLEARED',
      notifications: this.notifications
    });
    return count;
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotifications(filter = {}) {
    let filtered = [...this.notifications];

    if (filter.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    if (filter.read !== undefined) {
      filtered = filtered.filter(n => n.read === filter.read);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }
}

// Observer para logging
class LoggingObserver extends Observer {
  constructor(level = 'info') {
    super();
    this.level = level;
  }

  update(data) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${data.type}: ${JSON.stringify(data, null, 2)}`;
    
    switch (this.level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }
}

// Observer para persistencia en localStorage
class LocalStorageObserver extends Observer {
  constructor(key = 'app_notifications') {
    super();
    this.storageKey = key;
  }

  update(data) {
    try {
      if (data.notifications) {
        localStorage.setItem(this.storageKey, JSON.stringify(data.notifications));
      }
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
      return [];
    }
  }
}

// Observer para métricas y analytics
class AnalyticsObserver extends Observer {
  constructor(analyticsService) {
    super();
    this.analyticsService = analyticsService;
  }

  update(data) {
    if (this.analyticsService && typeof this.analyticsService.track === 'function') {
      this.analyticsService.track('notification_event', {
        type: data.type,
        timestamp: new Date().toISOString(),
        notification_type: data.notification?.type,
        notification_priority: data.notification?.priority
      });
    }
  }
}

// Sistema de estado global usando Observer
class StateManager extends Subject {
  constructor(initialState = {}) {
    super();
    this.state = { ...initialState };
    this.history = [{ ...initialState }];
    this.maxHistory = 50;
  }

  setState(updates, action = 'UPDATE_STATE') {
    const previousState = { ...this.state };
    
    if (typeof updates === 'function') {
      this.state = { ...this.state, ...updates(this.state) };
    } else {
      this.state = { ...this.state, ...updates };
    }

    // Agregar al historial
    this.history.unshift({ ...this.state });
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    this.notify({
      type: action,
      previousState,
      currentState: this.state,
      updates
    });
  }

  getState() {
    return { ...this.state };
  }

  getStateSlice(key) {
    return this.state[key];
  }

  resetState(newState = {}) {
    this.setState(newState, 'RESET_STATE');
  }

  undo() {
    if (this.history.length > 1) {
      this.history.shift(); // Remover estado actual
      const previousState = this.history[0];
      this.state = { ...previousState };
      
      this.notify({
        type: 'UNDO_STATE',
        currentState: this.state
      });
      
      return true;
    }
    return false;
  }

  getHistory() {
    return [...this.history];
  }
}

// Hook personalizado para usar el sistema de notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const notificationSystemRef = React.useRef(null);

  React.useEffect(() => {
    // Crear sistema de notificaciones si no existe
    if (!notificationSystemRef.current) {
      notificationSystemRef.current = new NotificationSystem();
      
      // Cargar notificaciones desde localStorage
      const storageObserver = new LocalStorageObserver();
      const savedNotifications = storageObserver.loadFromStorage();
      if (savedNotifications.length > 0) {
        notificationSystemRef.current.notifications = savedNotifications;
      }
      
      // Suscribir observers
      notificationSystemRef.current.subscribe(storageObserver);
      
      if (process.env.NODE_ENV === 'development') {
        notificationSystemRef.current.subscribe(new LoggingObserver('debug'));
      }
    }

    const system = notificationSystemRef.current;

    // Observer para actualizar el estado del componente
    const componentObserver = new (class extends Observer {
      update(data) {
        setNotifications([...data.notifications]);
        setUnreadCount(system.getUnreadCount());
      }
    })();

    const unsubscribe = system.subscribe(componentObserver);

    // Inicializar estado
    setNotifications([...system.notifications]);
    setUnreadCount(system.getUnreadCount());

    return unsubscribe;
  }, []);

  const addNotification = React.useCallback((notification) => {
    return notificationSystemRef.current?.addNotification(notification);
  }, []);

  const removeNotification = React.useCallback((id) => {
    return notificationSystemRef.current?.removeNotification(id);
  }, []);

  const markAsRead = React.useCallback((id) => {
    return notificationSystemRef.current?.markAsRead(id);
  }, []);

  const markAllAsRead = React.useCallback(() => {
    return notificationSystemRef.current?.markAllAsRead();
  }, []);

  const clearAll = React.useCallback(() => {
    return notificationSystemRef.current?.clearAll();
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
};

// Hook para manejo de estado global
export const useGlobalState = (initialState = {}) => {
  const [state, setState] = React.useState(initialState);
  const stateManagerRef = React.useRef(null);

  React.useEffect(() => {
    if (!stateManagerRef.current) {
      stateManagerRef.current = new StateManager(initialState);
    }

    const manager = stateManagerRef.current;

    const componentObserver = new (class extends Observer {
      update(data) {
        setState({ ...data.currentState });
      }
    })();

    const unsubscribe = manager.subscribe(componentObserver);
    setState({ ...manager.getState() });

    return unsubscribe;
  }, []);

  const updateState = React.useCallback((updates, action) => {
    stateManagerRef.current?.setState(updates, action);
  }, []);

  const resetState = React.useCallback((newState) => {
    stateManagerRef.current?.resetState(newState);
  }, []);

  const undo = React.useCallback(() => {
    return stateManagerRef.current?.undo();
  }, []);

  return {
    state,
    updateState,
    resetState,
    undo,
    getHistory: () => stateManagerRef.current?.getHistory() || []
  };
};

// Instancia global del sistema de notificaciones
export const globalNotificationSystem = new NotificationSystem();

// Helpers para tipos de notificación comunes
export const NotificationTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const createNotification = (type, title, message, options = {}) => ({
  type,
  title,
  message,
  priority: 'normal',
  autoClose: true,
  duration: 5000,
  ...options
});

export {
  Observer,
  Subject,
  NotificationSystem,
  LoggingObserver,
  LocalStorageObserver,
  AnalyticsObserver,
  StateManager
};

export default NotificationSystem;