import { mockDb } from './mockDb';
import { API_CONFIG, getFetchConfig } from './config';

/**
 * Service to manage notifications.
 * Supports both local memory and server API.
 */

// Listeners for notification updates
let listeners = [];

export const notificationService = {
  // מחזירה את כל ההודעות
  getNotifications: async (user) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/notifications`, getFetchConfig());
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    }

    return mockDb.notifications.filter(n => 
      (n.userId === user.id) || 
      (n.role === user.role) ||
      (n.studentName === user.fullName)
    ).sort((a, b) => new Date(b.time) - new Date(a.time));
  },

  // מוסיף הודעה חדשה לרשימת ההודעות
  addNotification: async (notification) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/notifications`, getFetchConfig('POST', notification));
      if (!response.ok) throw new Error('Failed to add notification');
      const newNotification = await response.json();
      notifyListeners();
      return newNotification;
    }

    // ייצור אובייקט ההודעה החדשה
    const newNotification = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toISOString(),
      read: false,
      ...notification
    };
    // מוסיף ההודעה החדשה לתחילת הרשימה
    mockDb.notifications.unshift(newNotification);
    // להודיע את המשתמשים המאזינים
    notifyListeners();
    return newNotification;
  },

  // לסמן ההודעה( לפי ID) כנקראה
  markAsRead: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/notifications/${id}/read`, getFetchConfig('PATCH'));
      if (!response.ok) throw new Error('Failed to mark notification as read');
      notifyListeners();
      return;
    }

    const index = mockDb.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      mockDb.notifications[index].read = true;
      notifyListeners();
    }
  },

  // לסמן את כל ההודעות כנקראות
  markAllAsRead: async (user) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/notifications/read-all`, getFetchConfig('PATCH', { userId: user.id, role: user.role }));
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      notifyListeners();
      return;
    }

    mockDb.notifications = mockDb.notifications.map(n => {
      if (n.userId === user.id || n.role === user.role) {
        return { ...n, read: true };
      }
      return n;
    });
    notifyListeners();
  },

  // למחיקת ההודעה
  deleteNotification: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/notifications/${id}`, getFetchConfig('DELETE'));
      if (!response.ok) throw new Error('Failed to delete notification');
      notifyListeners();
      return;
    }

    mockDb.notifications = mockDb.notifications.filter(n => n.id !== id);
    notifyListeners();
  },

  // המאזין יירשם לרשימת המאזינים
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

// להודיע את המאזינים
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};
