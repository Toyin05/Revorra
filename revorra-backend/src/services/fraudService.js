import prisma from '../config/prisma.js';
import activityService from './activityService.js';

// Constants
const MAX_ACCOUNTS_PER_IP = 5;
const MAX_TASK_COMPLETIONS_PER_HOUR = 10;
const MAX_REFERRALS_FROM_SAME_IP = 3;

/**
 * Fraud Detection Service
 * Provides functions to detect and prevent fraud
 */
const fraudService = {
  /**
   * Detect multiple accounts from same IP
   * @param {string} ipAddress - IP address to check
   * @returns {Object} Detection result with users count
   */
  async detectMultipleAccountsFromIP(ipAddress) {
    if (!ipAddress) return { detected: false, count: 0 };

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { signupIP: ipAddress },
          { lastLoginIP: ipAddress }
        ]
      },
      select: { id: true, email: true, username: true, createdAt: true }
    });

    const uniqueUsers = [...new Map(users.map(u => [u.id, u])).values()];
    
    return {
      detected: uniqueUsers.length > MAX_ACCOUNTS_PER_IP,
      count: uniqueUsers.length,
      users: uniqueUsers,
      threshold: MAX_ACCOUNTS_PER_IP
    };
  },

  /**
   * Detect referral abuse (same IP for referrer and referred)
   * @param {string} referrerId - Referrer user ID
   * @param {string} referredUserId - Referred user ID
   * @param {string} ipAddress - Signup IP
   * @returns {boolean} True if abuse detected
   */
  async detectReferralAbuse(referrerId, referredUserId, ipAddress) {
    try {
      // Check if referrer and referred have same IP
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { signupIP: true, deviceFingerprint: true }
      });

      if (!referrer) return false;

      // Check IP match
      const sameIP = referrer.signupIP === ipAddress;
      
      // Check device fingerprint match
      const referredUser = await prisma.user.findUnique({
        where: { id: referredUserId },
        select: { deviceFingerprint: true }
      });

      const sameDevice = referrer.deviceFingerprint && 
                        referredUser?.deviceFingerprint === referrer.deviceFingerprint;

      return sameIP || sameDevice;
    } catch (error) {
      console.error('Error detecting referral abuse:', error);
      return false;
    }
  },

  /**
   * Check task completion rate limit
   * @param {string} userId - User ID
   * @returns {Object} { allowed: boolean, recentCount: number, limit: number }
   */
  async checkTaskCompletionCooldown(userId) {
    try {
      const recentCount = await activityService.countRecentActivities(
        userId, 
        'TASK_COMPLETION', 
        1 // 1 hour
      );

      return {
        allowed: recentCount < MAX_TASK_COMPLETIONS_PER_HOUR,
        recentCount,
        limit: MAX_TASK_COMPLETIONS_PER_HOUR,
        remaining: Math.max(0, MAX_TASK_COMPLETIONS_PER_HOUR - recentCount)
      };
    } catch (error) {
      console.error('Error checking task completion cooldown:', error);
      return { allowed: true, recentCount: 0, limit: MAX_TASK_COMPLETIONS_PER_HOUR };
    }
  },

  /**
   * Check withdrawal rate limit
   * @param {string} userId - User ID
   * @returns {Object} { allowed: boolean, recentCount: number }
   */
  async checkWithdrawalCooldown(userId) {
    try {
      const recentCount = await activityService.countRecentActivities(
        userId, 
        'WITHDRAWAL_REQUEST', 
        24 // 24 hours
      );

      // Allow max 3 withdrawals per day
      const MAX_WITHDRAWALS_PER_DAY = 3;
      
      return {
        allowed: recentCount < MAX_WITHDRAWALS_PER_DAY,
        recentCount,
        limit: MAX_WITHDRAWALS_PER_DAY,
        remaining: Math.max(0, MAX_WITHDRAWALS_PER_DAY - recentCount)
      };
    } catch (error) {
      console.error('Error checking withdrawal cooldown:', error);
      return { allowed: true, recentCount: 0, limit: 3 };
    }
  },

  /**
   * Flag suspicious user account
   * @param {string} userId - User ID to flag
   * @param {string} reason - Reason for flagging
   */
  async flagSuspiciousUser(userId, reason) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSuspicious: true,
          fraudReason: reason
        }
      });
      return true;
    } catch (error) {
      console.error('Error flagging suspicious user:', error);
      return false;
    }
  },

  /**
   * Unflag user account
   * @param {string} userId - User ID to unflag
   */
  async unflagSuspiciousUser(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSuspicious: false,
          fraudReason: null
        }
      });
      return true;
    } catch (error) {
      console.error('Error unflagging user:', error);
      return false;
    }
  },

  /**
   * Get all suspicious users
   * @param {number} limit - Number of results
   * @returns {Array} List of suspicious users
   */
  async getSuspiciousUsers(limit = 50) {
    try {
      return await prisma.user.findMany({
        where: { isSuspicious: true },
        select: {
          id: true,
          email: true,
          username: true,
          fraudReason: true,
          createdAt: true,
          signupIP: true,
          deviceFingerprint: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting suspicious users:', error);
      return [];
    }
  },

  /**
   * Detect device fingerprint abuse
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {Object} Detection result
   */
  async detectDeviceAbuse(deviceFingerprint) {
    if (!deviceFingerprint) return { detected: false, count: 0 };

    const users = await prisma.user.findMany({
      where: { deviceFingerprint },
      select: { id: true, email: true, username: true, createdAt: true }
    });

    return {
      detected: users.length > 1,
      count: users.length,
      users,
      threshold: 1
    };
  },

  /**
   * Analyze user for fraud risk
   * @param {string} userId - User ID
   * @returns {Object} Risk analysis
   */
  async analyzeUserRisk(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          wallet: true,
          _count: {
            select: {
              referrals: true,
              taskCompletions: true,
              withdrawals: true,
              transactions: true
            }
          }
        }
      });

      if (!user) return null;

      // Calculate risk factors
      const riskFactors = [];
      
      // Check if suspicious
      if (user.isSuspicious) {
        riskFactors.push({ factor: 'suspicious_account', severity: 'high', reason: user.fraudReason });
      }

      // Check IP consistency
      if (user.signupIP && user.lastLoginIP && user.signupIP !== user.lastLoginIP) {
        riskFactors.push({ factor: 'ip_mismatch', severity: 'medium', reason: 'Signup and login IPs differ' });
      }

      // Check device fingerprint
      if (!user.deviceFingerprint) {
        riskFactors.push({ factor: 'no_device_fingerprint', severity: 'low', reason: 'No device fingerprint recorded' });
      }

      // Check high referral count
      if (user._count.referrals > 20) {
        riskFactors.push({ factor: 'high_referral_count', severity: 'medium', reason: `Has ${user._count.referrals} referrals` });
      }

      // Check high task completion count
      if (user._count.taskCompletions > 100) {
        riskFactors.push({ factor: 'high_task_count', severity: 'medium', reason: `Completed ${user._count.taskCompletions} tasks` });
      }

      // Check high withdrawal count
      if (user._count.withdrawals > 50) {
        riskFactors.push({ factor: 'high_withdrawal_count', severity: 'medium', reason: `Has ${user._count.withdrawals} withdrawals` });
      }

      return {
        userId: user.id,
        email: user.email,
        username: user.username,
        riskScore: riskFactors.length * 25, // 0-100 scale
        riskFactors,
        stats: {
          referrals: user._count.referrals,
          tasksCompleted: user._count.taskCompletions,
          withdrawals: user._count.withdrawals,
          transactions: user._count.transactions,
          walletBalance: user.wallet ? 
            user.wallet.referralBalance + user.wallet.taskBalance + user.wallet.onehubBalance : 0
        }
      };
    } catch (error) {
      console.error('Error analyzing user risk:', error);
      return null;
    }
  },

  /**
   * Update user login IP
   * @param {string} userId - User ID
   * @param {string} ipAddress - New IP address
   */
  async updateLoginIP(userId, ipAddress) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginIP: ipAddress }
      });
      return true;
    } catch (error) {
      console.error('Error updating login IP:', error);
      return false;
    }
  },

  /**
   * Check if user is banned/suspended
   * @param {string} userId - User ID
   * @returns {boolean} True if user is suspended
   */
  async isUserSuspended(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true }
      });
      return user?.isSuspended || false;
    } catch (error) {
      console.error('Error checking suspension:', error);
      return false;
    }
  }
};

export default fraudService;
