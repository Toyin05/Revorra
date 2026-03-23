import prisma from '../config/prisma.js';

/**
 * Get platform overview stats
 * GET /api/admin/stats
 */
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTasks,
      totalTaskCompletions,
      totalWithdrawals,
      pendingWithdrawals,
      approvedWithdrawals,
      paidWithdrawals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.taskCompletion.count(),
      prisma.withdrawalRequest.count(),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { status: 'APPROVED' } }),
      prisma.withdrawalRequest.count({ where: { status: 'PAID' } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        totalTaskCompletions,
        totalWithdrawals,
        pendingWithdrawals,
        approvedWithdrawals,
        paidWithdrawals
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get platform stats'
    });
  }
};

/**
 * Get revenue and payout analytics
 * GET /api/admin/revenue
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const [
      taskRewards,
      referralRewards,
      onehubRewards,
      withdrawnAmount
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'TASK_REWARD', status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'GAME_REWARD', status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL_PAID', status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTaskRewardsPaid: taskRewards._sum.amount || 0,
        totalReferralRewardsPaid: referralRewards._sum.amount || 0,
        totalOnehubRewardsPaid: onehubRewards._sum.amount || 0,
        totalWithdrawn: withdrawnAmount._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics'
    });
  }
};

/**
 * Get task analytics
 * GET /api/admin/analytics/tasks
 */
export const getTaskAnalytics = async (req, res) => {
  try {
    const [
      totalTasks,
      activeTasks,
      totalCompletions,
      pendingApprovals
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { isActive: true } }),
      prisma.taskCompletion.count(),
      prisma.taskCompletion.count({ where: { status: 'PENDING' } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTasks,
        activeTasks,
        totalCompletions,
        pendingApprovals
      }
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get task analytics'
    });
  }
};

/**
 * Get withdrawal analytics
 * GET /api/admin/analytics/withdrawals
 */
export const getWithdrawalAnalytics = async (req, res) => {
  try {
    const [
      totalWithdrawals,
      pending,
      approved,
      paid,
      totalAmount
    ] = await Promise.all([
      prisma.withdrawalRequest.count(),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { status: 'APPROVED' } }),
      prisma.withdrawalRequest.count({ where: { status: 'PAID' } }),
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalWithdrawals,
        pending,
        approved,
        paid,
        totalWithdrawalAmount: totalAmount._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Get withdrawal analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal analytics'
    });
  }
};

/**
 * Get user analytics
 * GET /api/admin/analytics/users
 */
export const getUserAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      adminUsers,
      regularUsers,
      usersWithReferrals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({
        where: {
          referrals: {
            some: {}
          }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        adminUsers,
        regularUsers,
        usersWithReferrals
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user analytics'
    });
  }
};

/**
 * Get top referrers
 * GET /api/admin/referrals/top
 */
export const getTopReferrers = async (req, res) => {
  try {
    const topReferrers = await prisma.user.findMany({
      where: {
        referrals: {
          some: {}
        }
      },
      select: {
        username: true,
        _count: {
          select: {
            referrals: true
          }
        }
      },
      orderBy: {
        referrals: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const formattedData = topReferrers.map(user => ({
      username: user.username,
      referralCount: user._count.referrals
    }));

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Get top referrers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get top referrers'
    });
  }
};

export default {
  getPlatformStats,
  getRevenueAnalytics,
  getTaskAnalytics,
  getWithdrawalAnalytics,
  getUserAnalytics,
  getTopReferrers
};
