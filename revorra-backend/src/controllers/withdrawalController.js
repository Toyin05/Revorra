import { requestWithdrawal, getWithdrawalHistory } from '../services/withdrawalService.js';
import fraudService from '../services/fraudService.js';
import activityService from '../services/activityService.js';
import prisma from '../config/prisma.js';

/**
 * Request a withdrawal
 */
export const requestWithdrawalHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletType, amount, method, accountNumber, accountName, bankName, couponCode } = req.body;

    // Get metadata from request
    const ipAddress = req.metadata?.ip || req.ipAddress;
    const deviceFingerprint = req.metadata?.deviceFingerprint || req.deviceFingerprint;

    // Check fraud: withdrawal cooldown
    const cooldownCheck = await fraudService.checkWithdrawalCooldown(userId);
    if (!cooldownCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many withdrawal requests. You can request ${cooldownCheck.limit} withdrawals per 24 hours. You've made ${cooldownCheck.recentCount} already.`,
      });
    }

    // Check if user is suspended
    const isSuspended = await fraudService.isUserSuspended(userId);
    if (isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended.',
      });
    }

    // Validate required fields
    if (!walletType || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'walletType, amount, and method are required.',
      });
    }

    // Validate wallet type
    if (!['REFERRAL', 'TASK', 'ONEHUB'].includes(walletType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet type. Must be REFERRAL, TASK, or ONEHUB.',
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0.',
      });
    }

    // Check if user has permission flags
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        canWithdrawTask: true,
        canWithdrawReferral: true,
        canWithdrawOnehub: true
      }
    });

    // Check permission - user just needs a valid coupon code in the request
    // OR has the permission flags set
    // OR has any redeemed coupon (from either CouponRequest table)

    let hasPermission = false;

    // Check permission flags first
    if (walletType === 'TASK' && user.canWithdrawTask) hasPermission = true;
    if (walletType === 'REFERRAL' && user.canWithdrawReferral) hasPermission = true;
    if (walletType === 'ONEHUB' && user.canWithdrawOnehub) hasPermission = true;

    // If no permission flag, check if user provided a valid coupon code
    if (!hasPermission && couponCode && couponCode.trim() !== '') {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.trim().toUpperCase(),
          isUsed: false
        }
      });

      if (coupon) {
        hasPermission = true;

        // Mark coupon as used
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: {
            isUsed: true,
            usedBy: userId,
            usedAt: new Date()
          }
        });

        // Set permission flag for this wallet type so future withdrawals don't need a coupon
        const flagMap = {
          'TASK': { canWithdrawTask: true },
          'REFERRAL': { canWithdrawReferral: true },
          'ONEHUB': { canWithdrawOnehub: true }
        };

        await prisma.user.update({
          where: { id: userId },
          data: flagMap[walletType] || {}
        });
      }
    }

    // Also check old CouponRequest flow for backwards compatibility
    if (!hasPermission) {
      const redeemedCouponRequest = await prisma.couponRequest.findFirst({
        where: {
          userId: userId,
          status: 'REDEEMED'
        }
      });
      if (redeemedCouponRequest) hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Please enter a valid coupon code to unlock withdrawal.'
      });
    }

    const withdrawalDetails = {
      method,
      accountNumber,
      accountName,
      bankName,
    };

    const withdrawal = await requestWithdrawal(userId, walletType, amount, withdrawalDetails);

    // Log activity
    await activityService.logActivity(
      userId,
      'WITHDRAWAL_REQUEST',
      ipAddress,
      deviceFingerprint,
      { withdrawalId: withdrawal.id, amount, walletType }
    );

    return res.status(201).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to request withdrawal.',
    });
  }
};

/**
 * Get user's withdrawal history
 */
export const getWithdrawalHistoryHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await getWithdrawalHistory(userId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get withdrawal history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get withdrawal history.',
    });
  }
};

export default {
  requestWithdrawalHandler,
  getWithdrawalHistoryHandler,
};