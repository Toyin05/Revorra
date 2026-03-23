import prisma from '../config/prisma.js';

// Minimum withdrawal thresholds
const MIN_WITHDRAWAL_AMOUNTS = {
  REFERRAL: 35,
  TASK: 89,
  ONEHUB: 16,
};

// Daily earning limit
const MAX_DAILY_EARNINGS = 5.00;

// Reward transaction types that count toward daily limit
const REWARD_TYPES = [
  'TASK_REWARD',
  'SPONSORED_POST_REWARD',
  'REFERRAL_REWARD',
  'INDIRECT_REFERRAL',
  'SPONSORED_SHARE_REWARD',
  'GAME_REWARD',
  'WELCOME_BONUS'
];

// Map wallet type to database field
const walletFieldMap = {
  REFERRAL: { balance: 'referralBalance', locked: 'lockedReferralBalance' },
  TASK: { balance: 'taskBalance', locked: 'lockedTaskBalance' },
  ONEHUB: { balance: 'onehubBalance', locked: 'lockedOnehubBalance' },
};

/**
 * Get total earnings for today
 * @param {string} userId - User's ID
 * @returns {number} Total earnings today
 */
export const getDailyEarnings = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      createdAt: { gte: today },
      status: 'COMPLETED',
      type: { in: REWARD_TYPES },
      amount: { gt: 0 }
    },
    select: { amount: true }
  });
  
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

/**
 * Check if user can earn more today
 * @param {string} userId - User's ID
 * @param {number} amount - Amount to check
 * @returns {Object} { canEarn: boolean, remaining: number, currentEarnings: number }
 */
export const checkDailyEarningsLimit = async (userId, amount) => {
  const currentEarnings = await getDailyEarnings(userId);
  const remaining = Math.max(0, MAX_DAILY_EARNINGS - currentEarnings);
  
  return {
    canEarn: currentEarnings + amount <= MAX_DAILY_EARNINGS,
    remaining,
    currentEarnings,
    maxAllowed: MAX_DAILY_EARNINGS
  };
};

/**
 * Get user's wallet
 * @param {string} userId - User's ID
 * @returns {Object} User's wallet
 */
export const getWallet = async (userId) => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  // Create wallet if doesn't exist
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId },
    });
  }

  return wallet;
};

/**
 * Credit wallet with amount
 * @param {string} userId - User's ID
 * @param {string} walletType - REFERRAL, TASK, or ONEHUB
 * @param {number} amount - Amount to credit
 * @param {string} description - Transaction description
 * @param {boolean} checkLimit - Whether to check daily earnings limit
 * @returns {Object} Updated wallet
 */
export const creditWallet = async (userId, walletType, amount, description, checkLimit = true) => {
  const fieldMap = walletFieldMap[walletType];
  if (!fieldMap) {
    throw new Error('Invalid wallet type');
  }

  // Check daily earnings limit if enabled
  if (checkLimit) {
    const { canEarn, remaining } = await checkDailyEarningsLimit(userId, amount);
    if (!canEarn) {
      throw new Error(`Daily earnings limit exceeded. Remaining: €${remaining.toFixed(2)}`);
    }
  }

  const wallet = await prisma.$transaction(async (tx) => {
    // Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        [fieldMap.balance]: {
          increment: amount,
        },
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId,
        walletType,
        type: getTransactionType(walletType),
        amount,
        description,
        status: 'COMPLETED',
      },
    });

    return updatedWallet;
  });

  return wallet;
};

/**
 * Lock balance for withdrawal
 * @param {string} userId - User's ID
 * @param {string} walletType - REFERRAL, TASK, or ONEHUB
 * @param {number} amount - Amount to lock
 * @returns {Object} Updated wallet
 */
export const lockBalance = async (userId, walletType, amount) => {
  const fieldMap = walletFieldMap[walletType];
  if (!fieldMap) {
    throw new Error('Invalid wallet type');
  }

  const wallet = await prisma.$transaction(async (tx) => {
    // First, check available balance
    const currentWallet = await tx.wallet.findUnique({ where: { userId } });
    const availableBalance = currentWallet[fieldMap.balance];

    if (availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Move amount from balance to locked balance
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        [fieldMap.balance]: {
          decrement: amount,
        },
        [fieldMap.locked]: {
          increment: amount,
        },
      },
    });

    return updatedWallet;
  });

  return wallet;
};

/**
 * Unlock balance (when withdrawal is rejected)
 * @param {string} userId - User's ID
 * @param {string} walletType - REFERRAL, TASK, or ONEHUB
 * @param {number} amount - Amount to unlock
 * @returns {Object} Updated wallet
 */
export const unlockBalance = async (userId, walletType, amount) => {
  const fieldMap = walletFieldMap[walletType];
  if (!fieldMap) {
    throw new Error('Invalid wallet type');
  }

  const wallet = await prisma.wallet.update({
    where: { userId },
    data: {
      [fieldMap.balance]: {
        increment: amount,
      },
      [fieldMap.locked]: {
        decrement: amount,
      },
    },
  });

  return wallet;
};

/**
 * Deduct locked balance (when withdrawal is paid)
 * @param {string} userId - User's ID
 * @param {string} walletType - REFERRAL, TASK, or ONEHUB
 * @param {number} amount - Amount to deduct
 * @returns {Object} Updated wallet
 */
export const deductLockedBalance = async (userId, walletType, amount) => {
  const fieldMap = walletFieldMap[walletType];
  if (!fieldMap) {
    throw new Error('Invalid wallet type');
  }

  const wallet = await prisma.wallet.update({
    where: { userId },
    data: {
      [fieldMap.locked]: {
        decrement: amount,
      },
    },
  });

  return wallet;
};

/**
 * Get transaction type based on wallet type
 */
const getTransactionType = (walletType) => {
  switch (walletType) {
    case 'REFERRAL':
      return 'REFERRAL_REWARD';
    case 'TASK':
      return 'TASK_REWARD';
    case 'ONEHUB':
      return 'GAME_REWARD';
    default:
      return 'TASK_REWARD';
  }
};

/**
 * Credit wallet with a specific transaction type
 * @param {string} userId - User's ID
 * @param {string} walletType - REFERRAL, TASK, or ONEHUB
 * @param {number} amount - Amount to credit
 * @param {string} description - Transaction description
 * @param {string} transactionType - Specific transaction type (e.g., SPONSORED_POST_REWARD)
 * @param {boolean} checkLimit - Whether to check daily earnings limit
 * @returns {Object} Updated wallet
 */
export const creditWalletWithType = async (userId, walletType, amount, description, transactionType, checkLimit = true) => {
  const fieldMap = walletFieldMap[walletType];
  if (!fieldMap) {
    throw new Error('Invalid wallet type');
  }

  // Check daily earnings limit if enabled
  if (checkLimit) {
    const { canEarn, remaining } = await checkDailyEarningsLimit(userId, amount);
    if (!canEarn) {
      throw new Error(`Daily earnings limit exceeded. Remaining: €${remaining.toFixed(2)}`);
    }
  }

  const wallet = await prisma.$transaction(async (tx) => {
    // Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        [fieldMap.balance]: {
          increment: amount,
        },
      },
    });

    // Create transaction record with specific type
    await tx.transaction.create({
      data: {
        userId,
        walletType,
        type: transactionType,
        amount,
        description,
        status: 'COMPLETED',
      },
    });

    return updatedWallet;
  });

  return wallet;
};

/**
 * Get minimum withdrawal amount for wallet type
 */
export const getMinimumWithdrawal = (walletType) => {
  return MIN_WITHDRAWAL_AMOUNTS[walletType] || 0;
};

/**
 * Validate withdrawal amount
 */
export const validateWithdrawalAmount = (walletType, amount) => {
  const minimum = getMinimumWithdrawal(walletType);
  if (amount < minimum) {
    throw new Error(`Minimum withdrawal for ${walletType} wallet is €${minimum}`);
  }
  return true;
};

/**
 * Get user's transaction history
 */
export const getTransactions = async (userId, walletType = null) => {
  const where = { userId };
  if (walletType) {
    where.walletType = walletType;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return transactions;
};

/**
 * Create wallet for user (called on registration)
 */
export const createWallet = async (userId) => {
  const existingWallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (existingWallet) {
    return existingWallet;
  }

  return await prisma.wallet.create({
    data: { userId },
  });
};

export default {
  getWallet,
  creditWallet,
  creditWalletWithType,
  lockBalance,
  unlockBalance,
  deductLockedBalance,
  getMinimumWithdrawal,
  validateWithdrawalAmount,
  getTransactions,
  createWallet,
};
