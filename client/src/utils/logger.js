/**
 * Browser-safe logger implementation.
 * Replaces Node-specific Winston to avoid bundle size issues and environment conflicts.
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Determine log level based on Vite's environment variables
const getLogLevel = () => {
  // Vite uses import.meta.env
  const mode = import.meta.env?.MODE || 'development';
  return mode === 'development' ? LOG_LEVELS.debug : LOG_LEVELS.info;
};

const currentLogLevel = getLogLevel();

/**
 * Recursively scrubs sensitive keys from metadata objects to prevent accidental PII leaks.
 */
const sanitizeMeta = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'secret', 'email', 'auth'];
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeMeta(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

/**
 * Formats the log message with timestamp and a unique request ID.
 * @param {string} level - The log level (e.g., 'info', 'error')
 * @param {string} message - The message to log
 * @param {Object} [meta] - Optional metadata object
 * @returns {Array} Array of arguments to be passed to console methods
 */
const formatLog = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  
  // Generate a simple unique ID for the log entry
  const requestId = (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID().split('-')[0] // Use short version for readability
    : Math.random().toString(36).substring(2, 7);

  const prefix = `[${timestamp}] [${level.toUpperCase()}] [RID:${requestId}]`;
  
  // If meta is provided, pass it as a separate argument for better browser console inspection
  if (meta && (typeof meta === 'object' || Array.isArray(meta))) {
    const cleanMeta = sanitizeMeta(meta);
    return [`${prefix} ${message}`, cleanMeta];
  }
  
  return [`${prefix} ${message}`];
};

const logger = {
  error: (message, meta) => {
    if (LOG_LEVELS.error <= currentLogLevel) {
      console.error(...formatLog('error', message, meta));
    }
  },
  warn: (message, meta) => {
    if (LOG_LEVELS.warn <= currentLogLevel) {
      console.warn(...formatLog('warn', message, meta));
    }
  },
  info: (message, meta) => {
    if (LOG_LEVELS.info <= currentLogLevel) {
      console.info(...formatLog('info', message, meta));
    }
  },
  debug: (message, meta) => {
    if (LOG_LEVELS.debug <= currentLogLevel) {
      console.debug(...formatLog('debug', message, meta));
    }
  },
};

export default logger;
