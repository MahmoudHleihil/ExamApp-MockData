import { mockDb } from './mockDb';

/**
 * Service to manage notifications in memory for the mock application.
 * Handles different notification types for Students, Teachers, and Admins.
 */

// Listeners for notification updates
let listeners = [];

export const notificationService = {
  // מחזירה את כל ההודעות
  getNotifications: (user) => {
    return mockDb.notifications.filter(n => 
      (n.userId === user.id) || 
      (n.role === user.role) ||
      (n.studentName === user.fullName)
    ).sort((a, b) => new Date(b.time) - new Date(a.time));
  },

  // מוסיף הודעה חדשה לרשימת ההודעות
  addNotification: (notification) => {
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
  markAsRead: (id) => {
    const index = mockDb.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      mockDb.notifications[index].read = true;
      notifyListeners();
    }
  },

  // לסמן את כל ההודעות כנקראות
  markAllAsRead: (user) => {
    mockDb.notifications = mockDb.notifications.map(n => {
      if (n.userId === user.id || n.role === user.role) {
        return { ...n, read: true };
      }
      return n;
    });
    notifyListeners();
  },

  // למחיקת ההודעה
  deleteNotification: (id) => {
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
