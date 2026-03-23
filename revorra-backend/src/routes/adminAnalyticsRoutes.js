import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  getPlatformStats,
  getRevenueAnalytics,
  getTaskAnalytics,
  getWithdrawalAnalytics,
  getUserAnalytics,
  getTopReferrers
} from '../controllers/adminAnalyticsController.js';

const router = express.Router();

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};

// GET /api/admin/stats - Platform overview
router.get('/stats', authenticateToken, requireAdmin, getPlatformStats);

// GET /api/admin/revenue - Revenue and payout analytics
router.get('/revenue', authenticateToken, requireAdmin, getRevenueAnalytics);

// GET /api/admin/analytics/tasks - Task analytics
router.get('/analytics/tasks', authenticateToken, requireAdmin, getTaskAnalytics);

// GET /api/admin/analytics/withdrawals - Withdrawal analytics
router.get('/analytics/withdrawals', authenticateToken, requireAdmin, getWithdrawalAnalytics);

// GET /api/admin/analytics/users - User analytics
router.get('/analytics/users', authenticateToken, requireAdmin, getUserAnalytics);

// GET /api/admin/referrals/top - Top referrers
router.get('/referrals/top', authenticateToken, requireAdmin, getTopReferrers);

export default router;
