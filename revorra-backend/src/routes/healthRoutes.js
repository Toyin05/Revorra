import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      status: 'ok',
      message: 'Revorra backend running',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(200).json({
      success: true,
      status: 'ok',
      message: 'Revorra backend running',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

export default router;
