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
    const { walletType, amount, method, accountNumber, accountName, bankName } = req.body;

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

    // Check if user has redeemed coupon for this wallet type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        canWithdrawTask: true,
        canWithdrawReferral: true,
        canWithdrawOnehub: true
      }
    });

    // Check if user has a REDEEMED coupon request of the matching type
    const redeemedCoupon = await prisma.couponRequest.findFirst({
      where: {
        userId: userId,
        type: walletType,
        status: 'REDEEMED'
      }
    });

    // Check if user can withdraw - either via flag OR via redeemed coupon
    let hasPermission = false;
    if (walletType === 'TASK' && (user.canWithdrawTask || redeemedCoupon)) hasPermission = true;
    if (walletType === 'REFERRAL' && (user.canWithdrawReferral || redeemedCoupon)) hasPermission = true;
    if (walletType === 'ONEHUB' && (user.canWithdrawOnehub || redeemedCoupon)) hasPermission = true;

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You must redeem a coupon first to unlock withdrawal for this wallet type.'
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
