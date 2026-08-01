import jwt from 'jsonwebtoken';
import { repository } from '../utils/repository.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'sahayak_ai_jwt_secret_institutional_key_2026');
    } catch (err) {
      return res.status(401).json({ message: 'Authentication failed. Invalid or expired token.' });
    }

    const user = await repository.getById('User', decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User associated with this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: `Internal server error in auth middleware: ${error.message}` });
  }
}

export function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
    }
    next();
  };
}
