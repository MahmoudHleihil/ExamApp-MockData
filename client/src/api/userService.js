import { mockDb } from './mockDb';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SALT_ROUNDS = 10;

// Keep track of failed attempts in memory
const failedAttempts = {};
const LOCKOUT_TIME = 30000; // 30 seconds
const MAX_ATTEMPTS = 3;

// אובייקט של שירות המשתמש
export const userService = {
  // פונקציה אסינכרונית לכניסה לחשבון של המשתמש
  login: async (email, password) => {
    logger.debug('Login attempt initiated', { email });
    await delay(800);
    // בודקים את הדוא"ל אחרי שמנקים אותו מרווחים והופכים את האותיות בו לקטנות
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check for lockout
    const now = Date.now();
    if (failedAttempts[sanitizedEmail] && failedAttempts[sanitizedEmail].count >= MAX_ATTEMPTS) {
      //  זמן נעילת החשבון אחרי הרבה נסיונות שגויות בכתיבת האימייל
      const remainingTime = Math.ceil((failedAttempts[sanitizedEmail].lockoutUntil - now) / 1000);
      if (remainingTime > 0) {
        logger.warn('Login blocked due to lockout', { email: sanitizedEmail, remainingTime });
        throw new Error(`Account temporarily locked. Please try again in ${remainingTime} seconds.`);
      } else {
        // Lockout expired
        delete failedAttempts[sanitizedEmail];
      }
    }

    // חיפוש המשתמש ב DB
    const user = mockDb.users.find(u => u.email.toLowerCase() === sanitizedEmail);
    
    // אם המשתמש קיים והסיסמה מתאימה  לסיסמה השמורה המוצפנת אז מוחזר המשתמש ללא הסיסמה
    if (user && await bcrypt.compare(password, user.password)) {
      if (user.status === 'pending') {
        logger.warn('Login attempt for pending account', { userId: user.id, email: user.email });
        throw new Error('Your account is pending approval by an administrator.');
      }
      // Reset failed attempts on success
      delete failedAttempts[sanitizedEmail];
      
      const { password: _, ...userWithoutPassword } = user;
      logger.info('User logged in successfully', { userId: user.id, role: user.role });
      return userWithoutPassword;
    }

    // Increment failed attempts
    failedAttempts[sanitizedEmail] = failedAttempts[sanitizedEmail] || { count: 0 };
    failedAttempts[sanitizedEmail].count++;
    
    // אחרי שעברנו את מספר הנסיונות המותרות החשבון יונעל 
    if (failedAttempts[sanitizedEmail].count >= MAX_ATTEMPTS) {
      failedAttempts[sanitizedEmail].lockoutUntil = now + LOCKOUT_TIME;
      logger.error('Account locked after multiple failed attempts', { email: sanitizedEmail });
      throw new Error('Too many failed attempts. Account locked for 30 seconds.');
    }

    logger.warn('Invalid login credentials', { email: sanitizedEmail, attemptsRemaining: MAX_ATTEMPTS - failedAttempts[sanitizedEmail].count });
    // לזרוק שגיאה אם הכניסה לא הצליחה
    throw new Error(`Invalid email or password. ${MAX_ATTEMPTS - failedAttempts[sanitizedEmail].count} attempts remaining.`);
  },

  // פונקציה אסינכונית להרשמה
  register: async (userData) => {
    logger.debug('Registration attempt', { email: userData.email, role: userData.role });
    await delay(1000);
    // חיפוש אם המשתמש קיים לפי האימייל שלו
    const existingUser = mockDb.users.find(u => u.email === userData.email);
    // מחזיר שגיאה אם כבר קיים
    if (existingUser) {
      logger.warn('Registration failed: User already exists', { email: userData.email });
      throw new Error('User already exists');
    }

    // Prohibit public Admin registration
    if (userData.role === 'Admin') {
      logger.error('Unauthorized attempt to register as Admin', { email: userData.email });
      throw new Error('Administrators can only be created by an existing Head Admin.');
    }

    // הסיסמה אחרי הצפנה
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

    // הוספת המשתמש ל db
    mockDb.users.push(newUser);

    // אם המשתמש החדש הוא מורה אז מצב החשבון שלו יהיה בהמתנה עד שיאושר על ידי ה Admin
    if (newUser.status === 'pending') {
      logger.info('Teacher registered, awaiting approval', { userId: newUser.id, email: newUser.email });
      throw new Error('Registration successful! Please wait for an administrator to approve your account.');
    }

    const { password: _, ...userWithoutPassword } = newUser;
    logger.info('User registered successfully', { userId: newUser.id, role: newUser.role });
    // החזרת המשתמש ללא סיסמה
    return userWithoutPassword;
  },

  // Only for Head Admin use
  createAdmin: async (adminData) => {
    logger.info('Head Admin creating new admin', { newAdminEmail: adminData.email });
    await delay(800);
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
    logger.info('New admin created successfully', { adminId: newUser.id });
    return newUser;
  },

  // פונקציה אסינכרונית שה admin משתמש בה לאשר את חשבון המורה
  approveUser: async (userId) => {
    logger.debug('Approving user', { userId });
    await delay(500);
    const user = mockDb.users.find(u => u.id === userId);
    if (user) {
      user.status = 'active';
      logger.info('User approved successfully', { userId });
      return true;
    }
    logger.warn('User approval failed: User not found', { userId });
    return false;
  },

  // פןנקציה אסינכרונית ליציאה מהחשבון
  logout: async () => {
    logger.info('User logging out');
    await delay(500);
    return true;
  },

  // מחזירה את כל המשתמשים
  getAllUsers: async () => {
    await delay(600);
    return mockDb.users.map(({ password, ...u }) => u);
  },

  // למחיקת המשתמשים
  deleteUser: async (id) => {
    logger.debug('Attempting to delete user', { userId: id });
    await delay(500);
    const index = mockDb.users.findIndex(u => u.id === id);
    if (index !== -1) {
      mockDb.users.splice(index, 1);
      logger.info('User deleted successfully', { userId: id });
      return true;
    }
    logger.error('Delete failed: User not found', { userId: id });
    throw new Error('User not found');
  },

  // מחזירה את מצב המערכת ל admin
  getSystemStats: async () => {
    logger.debug('Fetching system stats');
    await delay(700);
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
    logger.info('System stats fetched', { stats });
    return stats;
  },

  // בקשת שינוי הסיסמה
  requestPasswordReset: async (email) => {
    logger.debug('Password reset request', { email });
    await delay(1000);
    const user = mockDb.users.find(u => u.email === email);
    if (!user) {
      logger.warn('Password reset failed: User not found', { email });
      throw new Error('No user found with this email address.');
    }
    // Simulate generating a token
    const token = Math.random().toString(36).substr(2, 9);
    console.log(`[MOCK EMAIL SERVICE] Password reset link for ${email}: http://localhost:5173/reset-password?token=${token}&email=${email}`);
    logger.info('Password reset link generated', { email });
    return { success: true, message: 'Password reset link has been sent to your email (check console for mock link).' };
  },

  // שינוי סיסמה
  resetPassword: async (email, newPassword) => {
    logger.debug('Resetting password', { email });
    await delay(1000);
    const user = mockDb.users.find(u => u.email === email);
    if (!user) {
      logger.error('Password reset failed: User not found during actual reset', { email });
      throw new Error('User not found.');
    }
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    logger.info('Password reset successfully', { email });
    return { success: true };
  }
};
