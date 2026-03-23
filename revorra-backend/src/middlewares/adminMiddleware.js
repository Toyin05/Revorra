import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import prisma from '../config/prisma.js';

export const authenticateAdmin = async (req, res, next) => {
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
      
      // Get admin from database
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found.',
        });
      }
      
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Admin account is deactivated.',
        });
      }
      
      req.admin = admin;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'SUPER_ADMIN') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin privileges required.',
    });
  }
};

export const requireAdminOrSuperAdmin = (req, res, next) => {
  if (req.admin && ['SUPER_ADMIN', 'ADMIN'].includes(req.admin.role)) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};

export default authenticateAdmin;
