import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getAllWithdrawals, approveWithdrawal, rejectWithdrawal, markWithdrawalPaid } from '../services/withdrawalService.js';
import prisma from '../config/prisma.js';
import fraudService from '../services/fraudService.js';
import { distributeReferralRewards } from '../services/referralService.js';
import {
  getPlatformStats,
  getRevenueAnalytics,
  getTaskAnalytics,
  getWithdrawalAnalytics,
  getUserAnalytics,
  getTopReferrers
} from '../controllers/adminAnalyticsController.js';

const router = express.Router();

// Helper to generate coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RVRA-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    });
  }
  next();
};

// GET /api/admin/withdrawals - Get all withdrawals
router.get('/withdrawals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const withdrawals = await getAllWithdrawals(status);
    
    return res.status(200).json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get withdrawals.',
    });
  }
});

// POST /api/admin/withdrawals/:id/approve - Approve withdrawal
router.post('/withdrawals/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await approveWithdrawal(id);
    
    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve withdrawal.',
    });
  }
});

// POST /api/admin/withdrawals/:id/reject - Reject withdrawal
router.post('/withdrawals/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await rejectWithdrawal(id);
    
    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject withdrawal.',
    });
  }
});

// POST /api/admin/withdrawals/:id/paid - Mark withdrawal as paid
router.post('/withdrawals/:id/paid', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await markWithdrawalPaid(id);
    
    return res.status(200).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Mark paid withdrawal error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark withdrawal as paid.',
    });
  }
});

// POST /api/admin/coupons - Generate coupons
router.post('/coupons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { walletType, count = 1 } = req.body;

    if (!walletType || !['REFERRAL', 'TASK', 'ONEHUB'].includes(walletType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet type. Must be REFERRAL, TASK, or ONEHUB.',
      });
    }

    const coupons = [];
    for (let i = 0; i < count; i++) {
      const code = generateCouponCode();
      const coupon = await prisma.coupon.create({
        data: {
          code,
          walletType,
        },
      });
      coupons.push(coupon);
    }

    return res.status(201).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Create coupons error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create coupons.',
    });
  }
});

// ==================== COUPON REQUEST MANAGEMENT - SPECIFIC ROUTES FIRST ====================

// GET /api/admin/coupons/requests - Get all coupon requests (must be BEFORE /:id routes)
router.get('/coupons/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = status ? { status } : {};
    
    const requests = await prisma.couponRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response to include proofImage
    const formattedRequests = requests.map(req => ({
      id: req.id,
      userId: req.userId,
      username: req.user?.username,
      email: req.user?.email,
      type: req.type,
      amount: req.amount,
      status: req.status,
      proofImage: req.proofImage,
      couponCode: req.couponCode,
      createdAt: req.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Get coupon requests error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get coupon requests.',
    });
  }
});

// PATCH /api/admin/coupons/:id/approve - Approve coupon request (must be BEFORE /:id routes)
router.patch('/coupons/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find request
    const couponRequest = await prisma.couponRequest.findUnique({
      where: { id }
    });

    if (!couponRequest) {
      return res.status(404).json({
        success: false,
        message: 'Coupon request not found.'
      });
    }

    // Ensure status is PENDING
    if (couponRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.'
      });
    }

    // Ensure proofImage exists
    if (!couponRequest.proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve: No payment proof submitted.'
      });
    }

    // Generate coupon code
    const code = generateCouponCode();

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code,
        userId: couponRequest.userId,
        type: couponRequest.type
      }
    });

    // Update request status
    await prisma.couponRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        couponCode: code
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        couponCode: code,
        userId: couponRequest.userId,
        type: couponRequest.type,
        amount: couponRequest.amount
      },
      message: 'Coupon request approved successfully.'
    });
  } catch (error) {
    console.error('Approve coupon request error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve coupon request.',
    });
  }
});

// PATCH /api/admin/coupons/:id/reject - Reject coupon request (must be BEFORE /:id routes)
router.patch('/coupons/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find request
    const couponRequest = await prisma.couponRequest.findUnique({
      where: { id }
    });

    if (!couponRequest) {
      return res.status(404).json({
        success: false,
        message: 'Coupon request not found.'
      });
    }

    // Ensure status is PENDING
    if (couponRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.'
      });
    }

    // Update request status
    await prisma.couponRequest.update({
      where: { id },
      data: {
        status: 'REJECTED'
      }
    });

    return res.status(200).json({
      success: true,
      message: reason || 'Coupon request rejected.'
    });
  } catch (error) {
    console.error('Reject coupon request error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject coupon request.',
    });
  }
});

// GET /api/admin/coupons - Get all coupons
router.get('/coupons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { walletType, isUsed } = req.query;

    const where = {};
    if (walletType) where.walletType = walletType;
    if (isUsed !== undefined) where.isUsed = isUsed === 'true';

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get coupons.',
    });
  }
});

// GET /api/admin/users - Get all users (admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users.',
    });
  }
});

// GET /api/admin/tasks - Get all tasks (admin)
router.get('/tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tasks.',
    });
  }
});

// POST /api/admin/tasks - Create task
router.post('/tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, link, reward, taskType, shareLink, shareMessage, dailyLimit, expiresAt } = req.body;

    if (!title || !reward || !taskType) {
      return res.status(400).json({
        success: false,
        message: 'title, reward, and taskType are required.',
      });
    }

    // Validate taskType
    const validTaskTypes = ['NORMAL_TASK', 'SPONSORED_POST', 'EXTERNAL_LINK', 'SOCIAL_TASK'];
    if (!validTaskTypes.includes(taskType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid taskType. Must be one of: NORMAL_TASK, SPONSORED_POST, EXTERNAL_LINK, SOCIAL_TASK',
      });
    }

    // Auto-set expiry for daily tasks (24 hours from now if not provided)
    let taskExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (!taskExpiresAt && dailyLimit && dailyLimit > 0) {
      taskExpiresAt = new Date();
      taskExpiresAt.setHours(taskExpiresAt.getHours() + 24);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        link,
        reward,
        taskType,
        shareLink: shareLink || null,
        shareMessage: shareMessage || null,
        dailyLimit: dailyLimit || 1,
        expiresAt: taskExpiresAt,
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create task.',
    });
  }
});

// PUT /api/admin/tasks/:id - Update task
router.put('/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, reward, taskType, shareLink, shareMessage, dailyLimit, isActive, expiresAt } = req.body;

    // Validate taskType if provided
    if (taskType) {
      const validTaskTypes = ['NORMAL_TASK', 'SPONSORED_POST', 'EXTERNAL_LINK', 'SOCIAL_TASK'];
      if (!validTaskTypes.includes(taskType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid taskType. Must be one of: NORMAL_TASK, SPONSORED_POST, EXTERNAL_LINK, SOCIAL_TASK',
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(link && { link }),
        ...(reward && { reward }),
        ...(taskType && { taskType }),
        ...(shareLink !== undefined && { shareLink }),
        ...(shareMessage !== undefined && { shareMessage }),
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
    });

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task.',
    });
  }
});

// DELETE /api/admin/tasks/:id - Delete task
router.delete('/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task.',
    });
  }
});

// GET /api/admin/task-completions - Get pending task completions
router.get('/task-completions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status.toUpperCase();

    const completions = await prisma.taskCompletion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        task: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: completions,
    });
  } catch (error) {
    console.error('Get task completions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get task completions.',
    });
  }
});

// POST /api/admin/task-completions/:id/approve - Approve task completion
router.post('/task-completions/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the completion
    const completion = await prisma.taskCompletion.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!completion) {
      return res.status(404).json({
        success: false,
        message: 'Task completion not found.',
      });
    }

    if (completion.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Task completion is not pending.',
      });
    }

    // Update completion status
    const updated = await prisma.taskCompletion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    });

    // Credit user wallet - use appropriate transaction type based on task type
    const { creditWallet, creditWalletWithType } = await import('../services/walletService.js');
    
    if (completion.task.taskType === 'SPONSORED_POST') {
      // Use SPONSORED_POST_REWARD for sponsored posts
      await creditWalletWithType(
        completion.userId,
        'TASK',
        completion.task.reward,
        `Sponsored post reward: ${completion.task.title}`,
        'SPONSORED_POST_REWARD',
        true
      );
    } else {
      // Use regular TASK_REWARD for other tasks
      await creditWallet(
        completion.userId,
        'TASK',
        completion.task.reward,
        `Task reward: ${completion.task.title}`,
        true
      );
    }

    // Distribute referral rewards to referrers
    await distributeReferralRewards(completion.userId, completion.task.reward);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Approve task completion error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve task completion.',
    });
  }
});

// POST /api/admin/task-completions/:id/reject - Reject task completion
router.post('/task-completions/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const completion = await prisma.taskCompletion.findUnique({
      where: { id },
    });

    if (!completion) {
      return res.status(404).json({
        success: false,
        message: 'Task completion not found.',
      });
    }

    if (completion.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Task completion is not pending.',
      });
    }

    const updated = await prisma.taskCompletion.update({
      where: { id },
      data: {
        status: 'REJECTED',
        verifiedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Reject task completion error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject task completion.',
    });
  }
});

// GET /api/admin/stats - Get admin stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTasks,
      pendingTaskCompletions,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.taskCompletion.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        pendingTaskCompletions,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats.',
    });
  }
});

// GET /api/admin/fraud/suspicious-users - Get suspicious users
router.get('/fraud/suspicious-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await fraudService.getSuspiciousUsers();
    
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get suspicious users error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get suspicious users.',
    });
  }
});

// GET /api/admin/fraud/analyze/:userId - Analyze user risk
router.get('/fraud/analyze/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const analysis = await fraudService.analyzeUserRisk(userId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analyze user risk error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze user risk.',
    });
  }
});

// POST /api/admin/fraud/flag/:userId - Flag user as suspicious
router.post('/fraud/flag/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required.',
      });
    }
    
    const success = await fraudService.flagSuspiciousUser(userId, reason);
    
    return res.status(200).json({
      success,
      message: success ? 'User flagged as suspicious.' : 'Failed to flag user.',
    });
  } catch (error) {
    console.error('Flag user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to flag user.',
    });
  }
});

// POST /api/admin/fraud/unflag/:userId - Remove suspicious flag
router.post('/fraud/unflag/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const success = await fraudService.unflagSuspiciousUser(userId);
    
    return res.status(200).json({
      success,
      message: success ? 'User unflagged.' : 'Failed to unflag user.',
    });
  } catch (error) {
    console.error('Unflag user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to unflag user.',
    });
  }
});

// GET /api/admin/fraud/ip/:ip - Check IP for abuse
router.get('/fraud/ip/:ip', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params;
    const result = await fraudService.detectMultipleAccountsFromIP(ip);
    
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check IP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to check IP.',
    });
  }
});

// ==================== ANALYTICS ROUTES ====================

// GET /api/admin/stats - Platform overview stats
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

// ==================== ANNOUNCEMENTS ====================

// GET /api/admin/announcements - Get all announcements (admin)
router.get('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get announcements.'
    });
  }
});

// POST /api/admin/announcements - Create announcement
router.post('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, image, ctaLink } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required.',
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        image: image || null,
        ctaLink: ctaLink || null,
        active: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create announcement.',
    });
  }
});

// PATCH /api/admin/announcements/:id - Deactivate announcement
router.patch('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { active: active !== undefined ? active : false },
    });

    return res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update announcement.',
    });
  }
});

// DELETE /api/admin/announcements/:id - Delete announcement
router.delete('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete announcement.',
    });
  }
});

// ==================== ANNOUNCEMENTS ====================

// GET /api/admin/announcements - Get all announcements (admin)
router.get('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get announcements.'
    });
  }
});

// ==================== PLATFORM SETTINGS ====================

// GET /api/admin/settings - Get all platform settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.platformSetting.findMany();
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    
    return res.status(200).json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get settings.'
    });
  }
});

// POST /api/admin/settings - Update platform settings
router.post('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required.'
      });
    }
    
    // Update each setting
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });
    
    await Promise.all(updatePromises);
    
    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully.'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings.'
    });
  }
});

// POST /api/admin/settings/token - Update TopupWizard token only
router.post('/settings/token', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required.'
      });
    }
    
    await prisma.platformSetting.upsert({
      where: { key: 'TOPUPWIZARD_TOKEN' },
      update: { value: token },
      create: { key: 'TOPUPWIZARD_TOKEN', value: token }
    });
    
    return res.status(200).json({
      success: true,
      message: 'TopupWizard token updated successfully.'
    });
  } catch (error) {
    console.error('Update token error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update token.'
    });
  }
});

// POST /api/admin/settings/rate - Update EUR to NGN rate
router.post('/settings/rate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rate } = req.body;
    
    if (!rate || isNaN(parseFloat(rate))) {
      return res.status(400).json({
        success: false,
        message: 'Valid rate number is required.'
      });
    }
    
    await prisma.platformSetting.upsert({
      where: { key: 'EUR_TO_NGN_RATE' },
      update: { value: rate.toString() },
      create: { key: 'EUR_TO_NGN_RATE', value: rate.toString() }
    });
    
    return res.status(200).json({
      success: true,
      message: 'EUR to NGN rate updated successfully.'
    });
  } catch (error) {
    console.error('Update rate error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update rate.'
    });
  }
});

// ==================== PLATFORM SETTINGS END ====================

export default router; 
