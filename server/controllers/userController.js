import { mockDb } from '../data/mockDb.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const failedAttempts = {};
const LOCKOUT_TIME = 30000;
const MAX_ATTEMPTS = 3;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    if (failedAttempts[sanitizedEmail] && failedAttempts[sanitizedEmail].count >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((failedAttempts[sanitizedEmail].lockoutUntil - now) / 1000);
      if (remainingTime > 0) {
        return res.status(423).json({ message: `Account temporarily locked. Please try again in ${remainingTime} seconds.` });
      } else {
        delete failedAttempts[sanitizedEmail];
      }
    }

    const user = mockDb.users.find(u => u.email.toLowerCase() === sanitizedEmail);
    
    if (user && await bcrypt.compare(password, user.password)) {
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your account is pending approval by an administrator.' });
      }
      delete failedAttempts[sanitizedEmail];
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }

    failedAttempts[sanitizedEmail] = failedAttempts[sanitizedEmail] || { count: 0 };
    failedAttempts[sanitizedEmail].count++;
    
    if (failedAttempts[sanitizedEmail].count >= MAX_ATTEMPTS) {
      failedAttempts[sanitizedEmail].lockoutUntil = now + LOCKOUT_TIME;
      return res.status(423).json({ message: 'Too many failed attempts. Account locked for 30 seconds.' });
    }

    res.status(401).json({ message: `Invalid email or password. ${MAX_ATTEMPTS - failedAttempts[sanitizedEmail].count} attempts remaining.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const userData = req.body;
    const existingUser = mockDb.users.find(u => u.email === userData.email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    if (userData.role === 'Admin') {
      return res.status(403).json({ message: 'Administrators can only be created by an existing Head Admin.' });
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const newUser = {
      id: `u${mockDb.users.length + 1}`,
      ...userData,
      password: hashedPassword,
      submissions: [],
      scores: [],
      exams: [],
      status: userData.role === 'Teacher' ? 'pending' : 'active'
    };

    mockDb.users.push(newUser);

    if (newUser.status === 'pending') {
      return res.status(202).json({ message: 'Registration successful! Please wait for an administrator to approve your account.' });
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const adminData = req.body;
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);
    const newUser = {
      id: `u${mockDb.users.length + 1}`,
      ...adminData,
      password: hashedPassword,
      role: 'Admin',
      status: 'active',
      isSuperAdmin: false
    };
    mockDb.users.push(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = mockDb.users.find(u => u.id === id);
    if (user) {
      user.status = 'active';
      return res.json({ success: true });
    }
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = mockDb.users.map(({ password, ...u }) => u);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockDb.users.findIndex(u => u.id === id);
    if (index !== -1) {
      mockDb.users.splice(index, 1);
      return res.json({ success: true });
    }
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: mockDb.users.length,
      totalExams: mockDb.exams.length,
      totalSubmissions: mockDb.studentScores.length,
      roleDistribution: {
        Admin: mockDb.users.filter(u => u.role === 'Admin').length,
        Teacher: mockDb.users.filter(u => u.role === 'Teacher').length,
        Student: mockDb.users.filter(u => u.role === 'Student').length,
      },
      pendingApprovals: mockDb.users.filter(u => u.status === 'pending').length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = mockDb.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
