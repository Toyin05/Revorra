import { registerUser, loginUser, getCurrentUser, getReferralStats } from '../services/authService.js';
import prisma from '../config/prisma.js';
import fraudService from '../services/fraudService.js';
import activityService from '../services/activityService.js';

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
const isValidUsername = (username) => {
  // Username must contain only letters, numbers, and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 30;
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { email, password, username, referralCode, deviceFingerprint } = req.body;

    // 1. Validate input
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and username are required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must contain only letters, numbers, and underscores (3-30 characters).',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // 2. Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered.',
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken.',
        });
      }
    }

    // Get client IP and user agent (use metadata from middleware)
    const ipAddress = req.metadata?.ip || req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceFp = req.metadata?.deviceFingerprint || deviceFingerprint;

    // Check for referral abuse before registering
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { username: referralCode },
      });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code.',
        });
      }

      // Check if referral is from same IP/device
      const abuseDetected = await fraudService.detectReferralAbuse(
        referrer.id,
        null, // user not created yet
        ipAddress
      );

      if (abuseDetected) {
        console.log(`Potential referral abuse detected: referrer ${referrer.id} and signup IP ${ipAddress}`);
        // Don't block but flag for review
      }
    }

    // Check IP abuse (multiple accounts from same IP)
    const ipAbuse = await fraudService.detectMultipleAccountsFromIP(ipAddress);
    if (ipAbuse.detected) {
      console.log(`Potential IP abuse detected: ${ipAddress} has ${ipAbuse.count} accounts`);
    }

    // Check device fingerprint abuse
    if (deviceFp) {
      const deviceAbuse = await fraudService.detectDeviceAbuse(deviceFp);
      if (deviceAbuse.detected) {
        console.log(`Potential device abuse detected: ${deviceFp} has ${deviceAbuse.count} accounts`);
      }
    }

    // 4. Register user
    const result = await registerUser({
      email,
      password,
      username,
      referralCode,
      deviceFingerprint: deviceFp,
      ipAddress,
      userAgent,
    });

    // Log signup activity
    if (result.user) {
      await activityService.logActivity(
        result.user.id,
        'SIGNUP',
        ipAddress,
        deviceFp,
        { email, username }
      );
    }

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
};

/**
 * Login a user
 */
export const login = async (req, res) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Get client IP and user agent (use metadata from middleware)
    const ipAddress = req.metadata?.ip || req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceFp = req.metadata?.deviceFingerprint || deviceFingerprint;

    // Login user
    const result = await loginUser(email, password, deviceFp, ipAddress, userAgent);

    // Log login activity
    if (result.user) {
      await activityService.logActivity(
        result.user.id,
        'LOGIN',
        ipAddress,
        deviceFp,
        { email }
      );

      // Update last login IP
      await fraudService.updateLoginIP(result.user.id, ipAddress);
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
};

/**
 * Get current user profile
 */
export const me = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getCurrentUser(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user profile.',
    });
  }
};

/**
 * Get user's referral stats
 */
export const getReferrals = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await getReferralStats(userId);

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
};

export default {
  register,
  login,
  me,
  getReferrals,
};
