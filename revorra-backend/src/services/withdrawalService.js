import prisma from '../config/prisma.js';
import { lockBalance, unlockBalance, deductLockedBalance, getMinimumWithdrawal, validateWithdrawalAmount } from './walletService.js';

/**
 * Request a withdrawal
 */
export const requestWithdrawal = async (userId, walletType, amount, withdrawalDetails) => {
  // Validate minimum amount
  validateWithdrawalAmount(walletType, amount);

  // Check if user has pending withdrawal in last 24 hours
  const recentWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      status: 'PENDING',
    },
  });

  if (recentWithdrawal) {
    throw new Error('You have a pending withdrawal. Please wait 24 hours between withdrawals.');
  }

  // Lock the balance
  await lockBalance(userId, walletType, amount);

  // Create withdrawal request
  const withdrawal = await prisma.$transaction(async (tx) => {
    // Create withdrawal request
    const result = await tx.withdrawalRequest.create({
      data: {
        userId,
        walletType,
        amount,
        method: withdrawalDetails.method,
        accountNumber: withdrawalDetails.accountNumber,
        accountName: withdrawalDetails.accountName,
        bankName: withdrawalDetails.bankName,
        status: 'PENDING',
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId,
        walletType,
        type: 'WITHDRAWAL_REQUEST',
        amount,
        description: `Withdrawal request: €${amount}`,
        status: 'PENDING',
      },
    });

    return result;
  });

  return withdrawal;
};

/**
 * Approve withdrawal (admin)
 */
export const approveWithdrawal = async (withdrawalId) => {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  if (withdrawal.status !== 'PENDING') {
    throw new Error('Withdrawal is not pending');
  }

  const updated = await prisma.withdrawalRequest.update({
    where: { id: withdrawalId },
    data: {
      status: 'APPROVED',
      updatedAt: new Date(),
    },
  });

  return updated;
};

/**
 * Reject withdrawal (admin)
 */
export const rejectWithdrawal = async (withdrawalId) => {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  if (withdrawal.status !== 'PENDING') {
    throw new Error('Withdrawal is not pending');
  }

  // Unlock the balance
  await unlockBalance(withdrawal.userId, withdrawal.walletType, withdrawal.amount);

  // Update withdrawal status
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        updatedAt: new Date(),
      },
    });

    // Update transaction
    await tx.transaction.updateMany({
      where: {
        userId: withdrawal.userId,
        walletType: withdrawal.walletType,
        type: 'WITHDRAWAL_REQUEST',
      },
      data: {
        status: 'FAILED',
      },
    });

    return result;
  });

  return updated;
};

/**
 * Mark withdrawal as paid (admin)
 */
export const markWithdrawalPaid = async (withdrawalId) => {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  if (withdrawal.status !== 'APPROVED') {
    throw new Error('Withdrawal must be approved first');
  }

  // Deduct locked balance
  await deductLockedBalance(withdrawal.userId, withdrawal.walletType, withdrawal.amount);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: 'PAID',
        updatedAt: new Date(),
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId: withdrawal.userId,
        walletType: withdrawal.walletType,
        type: 'WITHDRAWAL_PAID',
        amount: withdrawal.amount,
        description: `Withdrawal paid: €${withdrawal.amount}`,
        status: 'COMPLETED',
      },
    });

    return result;
  });

  return updated;
};

/**
 * Get user's withdrawal history
 */
export const getWithdrawalHistory = async (userId) => {
  return await prisma.withdrawalRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

/**
 * Get all withdrawals (admin)
 */
export const getAllWithdrawals = async (status = null) => {
  const where = {};
  if (status) {
    where.status = status;
  }

  return await prisma.withdrawalRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get withdrawal by ID
 */
export const getWithdrawalById = async (withdrawalId) => {
  return await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
};

export default {
  requestWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  getWithdrawalHistory,
  getAllWithdrawals,
  getWithdrawalById,
};
