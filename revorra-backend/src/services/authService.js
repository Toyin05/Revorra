import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user and token
 */
export const registerUser = async (userData) => {
  const { email, password, username, referralCode, deviceFingerprint, ipAddress, userAgent } = userData;

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create user record
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        username,
        referralCode: username, // Username is also the referral code
        referredBy: referralCode || null,
        role: 'USER',
        isVerified: false,
        isSuspended: false,
        welcomeBonusClaimed: true, // Mark bonus as claimed
      },
    });

    // 2. Create wallet record with welcome bonus
    const welcomeBonus = 1.5;
    await tx.wallet.create({
      data: {
        userId: user.id,
        referralBalance: 0,
        taskBalance: 0,
        onehubBalance: 0,
        bonusBalance: welcomeBonus, // Credit welcome bonus
        lockedReferralBalance: 0,
        lockedTaskBalance: 0,
        lockedOnehubBalance: 0,
      },
    });

    // 3. Handle referral relationship if referralCode provided
    if (referralCode) {
      const referrer = await tx.user.findUnique({
        where: { username: referralCode },
      });

      if (referrer) {
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            reward: 0,
            status: 'PENDING',
          },
        });
      }
    }

    // 4. Save device record
    await tx.device.create({
      data: {
        userId: user.id,
        deviceFingerprint: deviceFingerprint || 'unknown',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    // 5. Create welcome bonus transaction
    await tx.transaction.create({
      data: {
        userId: user.id,
        type: 'WELCOME_BONUS',
        amount: welcomeBonus,
        reference: `WELCOME-${user.id}`,
        description: 'Welcome bonus reward',
        status: 'COMPLETED',
      },
    });

    return { user, welcomeBonus };
  });

  // Generate JWT token
  const token = generateToken(result.user.id, result.user.role);

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
      referralCode: result.user.referralCode,
    },
    welcomeBonus: result.welcomeBonus,
    message: 'Account created successfully',
  };
};

/**
 * Login a user
 * @param {string} email - User's email
 * @param {string} password - User @returns {Object's password
 *} User and token
 */
export const loginUser = async (email, password, deviceFingerprint, ipAddress, userAgent) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Compare password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Check if suspended
  if (user.isSuspended) {
    throw new Error('Account is suspended');
  }

  // Log device login
  await prisma.device.create({
    data: {
      userId: user.id,
      deviceFingerprint: deviceFingerprint || 'unknown',
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  };
};

/**
 * Get current user profile with balances
 * @param {string} userId - User's ID
 * @returns {Object} User profile and balances
 */
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Handle case where wallet doesn't exist
  const wallet = user.wallet || {
    referralBalance: 0,
    taskBalance: 0,
    onehubBalance: 0,
    lockedReferralBalance: 0,
    lockedTaskBalance: 0,
    lockedOnehubBalance: 0,
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      avatar: user.avatar,
      referralCode: user.referralCode,
      role: user.role,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
    },
    wallet: {
      referralBalance: wallet.referralBalance || 0,
      taskBalance: wallet.taskBalance || 0,
      onehubBalance: wallet.onehubBalance || 0,
      bonusBalance: wallet.bonusBalance || 0,
      lockedReferralBalance: wallet.lockedReferralBalance || 0,
      lockedTaskBalance: wallet.lockedTaskBalance || 0,
      lockedOnehubBalance: wallet.lockedOnehubBalance || 0,
    },
  };
};

/**
 * Get user's referral stats
 * @param {string} userId - User's ID
 * @returns {Object} Referral statistics
 */
export const getReferralStats = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get all referrals for this user
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
  });

  const pendingReferrals = referrals.filter((r) => r.status === 'PENDING');
  const confirmedReferrals = referrals.filter((r) => r.status === 'CONFIRMED');
  const rewardedReferrals = referrals.filter((r) => r.status === 'REWARDED');

  return {
    username: user.username,
    referralCode: user.referralCode,
    totalReferrals: referrals.length,
    pendingReferrals: pendingReferrals.length,
    confirmedReferrals: confirmedReferrals.length,
    rewardedReferrals: rewardedReferrals.length,
  };
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  getReferralStats,
};
