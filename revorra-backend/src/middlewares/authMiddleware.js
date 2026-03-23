import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import prisma from '../config/prisma.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isVerified: true,
          isSuspended: true,
        },
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }
      
      if (user.isSuspended) {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended.',
        });
      }
      
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      };
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

export default authenticateToken;
