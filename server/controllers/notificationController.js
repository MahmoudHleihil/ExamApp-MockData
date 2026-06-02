import { mockDb } from '../data/mockDb.js';

export const getNotifications = async (req, res) => {
  try {
    const { userId, role, fullName } = req.query;
    const notifications = mockDb.notifications.filter(n => 
      (n.userId === userId) || 
      (n.role === role) ||
      (n.studentName === fullName)
    ).sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addNotification = async (req, res) => {
  try {
    const notification = req.body;
    const newNotification = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toISOString(),
      read: false,
      ...notification
    };
    mockDb.notifications.unshift(newNotification);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockDb.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      mockDb.notifications[index].read = true;
      return res.json({ success: true });
    }
    res.status(404).json({ message: 'Notification not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { userId, role } = req.body;
    mockDb.notifications = mockDb.notifications.map(n => {
      if (n.userId === userId || n.role === role) {
        return { ...n, read: true };
      }
      return n;
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    mockDb.notifications = mockDb.notifications.filter(n => n.id !== id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
