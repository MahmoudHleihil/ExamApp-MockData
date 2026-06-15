import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token
 */
export const authenticate = (req, res, next) => {
  const token = req.cookies.etest_token;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 * @param {...string} roles - Allowed roles for the route
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access denied for role '${req.user.role}'. Required roles: [${roles.join(', ')}]` 
      });
    }

    next();
  };
};
