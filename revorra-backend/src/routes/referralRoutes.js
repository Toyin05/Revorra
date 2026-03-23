import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getReferralStats } from '../services/authService.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// GET /api/referrals - Get referral statistics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const stats = await getReferralStats(req.user.id);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get referral stats.',
    });
  }
});

// GET /api/referrals/stats - Get referral statistics (alternative route)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getReferralStats(req.user.id);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get referral stats.',
    });
  }
});

// GET /api/referrals/my-referrals - Get user's referrals
router.get('/my-referrals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            id: true,
            username: true,
            createdAt: true,
            taskCompletions: {
              where: { status: 'APPROVED' },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: referrals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/referrals/link - Get user's referral link
router.get('/link', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get referral link endpoint not yet implemented',
  });
});

export default router;
