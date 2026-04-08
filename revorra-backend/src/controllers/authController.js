import { registerUser, loginUser, getCurrentUser, getReferralStats } from '../services/authService.js';
import prisma from '../config/prisma.js';
import fraudService from '../services/fraudService.js';
import activityService from '../services/activityService.js';
import validator from 'validator';



/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { email, username, password, phone, referralCode, deviceFingerprint } = req.body;

    // Basic required field checks
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, username and password are required.'
      });
    }

    // Check email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'That doesn\'t look like a valid email address. Please check and try again.'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Your password must be at least 6 characters long.'
      });
    }

    // Check username format
    if (!/^[a-zA-Z0-9_\.]{3,30}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and can only contain letters, numbers, underscores and dots.'
      });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'That email address is already registered. Try logging in instead, or use a different email.'
      });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { username: username.trim() }
    });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: `The username "${username}" is already taken. Please choose a different one.`
      });
    }

    // Check if phone already exists (only if phone is provided)
    if (phone && phone.trim() !== '') {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: phone.trim() }
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'That phone number is already linked to an account. Please use a different number or log in to your existing account.'
        });
      }
    }

    // Check if referral code is valid (if provided)
    if (referralCode && referralCode.trim() !== '') {
      const referrer = await prisma.user.findFirst({
        where: { username: referralCode.trim() }
      });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'The referral code you entered is invalid. Please check it and try again, or leave it empty to continue.'
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
      phone,
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

    // After user is created, handle referral
    if (referralCode) {
      try {
        const referrer = await prisma.user.findFirst({
          where: { username: referralCode.trim() }
        });

        if (referrer && referrer.id !== result.user.id) {

          // Check if referral record already exists
          const existingReferral = await prisma.referral.findUnique({
            where: { referredUserId: result.user.id }
          });

          if (!existingReferral) {
            await prisma.referral.create({
              data: {
                referrerId: referrer.id,
                referredUserId: result.user.id,
                reward: 0.50,
                status: 'REWARDED'
              }
            });
          }

          // Always credit the wallet regardless of whether
          // referral record existed
          await prisma.wallet.update({
            where: { userId: referrer.id },
            data: { referralBalance: { increment: 0.50 } }
          });

          await prisma.transaction.create({
            data: {
              userId: referrer.id,
              walletType: 'REFERRAL',
              type: 'REFERRAL_REWARD',
              amount: 0.50,
              description: `Referral reward: ${result.user.username} joined using your link`,
              status: 'COMPLETED'
            }
          });

          // Credit new user €0.20 to referral balance
          await prisma.wallet.update({
            where: { userId: result.user.id },
            data: { referralBalance: { increment: 0.20 } }
          });

          await prisma.transaction.create({
            data: {
              userId: result.user.id,
              walletType: 'REFERRAL',
              type: 'INDIRECT_REFERRAL',
              amount: 0.20,
              description: 'Referral signup bonus',
              status: 'COMPLETED'
            }
          });

          // Check referrer's referrer (second level - indirect)
          const referrerReferral = await prisma.referral.findFirst({
            where: { referredUserId: referrer.id }
          });

          if (referrerReferral) {
            const indirectReferrer = await prisma.user.findUnique({
              where: { id: referrerReferral.referrerId }
            });

            if (indirectReferrer) {
              await prisma.wallet.update({
                where: { userId: indirectReferrer.id },
                data: { referralBalance: { increment: 0.20 } }
              });

              await prisma.transaction.create({
                data: {
                  userId: indirectReferrer.id,
                  walletType: 'REFERRAL',
                  type: 'INDIRECT_REFERRAL',
                  amount: 0.20,
                  description: `Indirect referral: ${result.user.username} joined via ${referrer.username}`,
                  status: 'COMPLETED'
                }
              });
            }
          }
        }
      } catch (referralError) {
        console.error('Referral processing error:', referralError);
        // Don't fail registration if referral processing fails
      }
    }

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(400).json({
          success: false,
          message: 'That email address is already registered. Try logging in instead.'
        });
      }
      if (field === 'username') {
        return res.status(400).json({
          success: false,
          message: 'That username is already taken. Please choose a different one.'
        });
      }
      if (field === 'phone') {
        return res.status(400).json({
          success: false,
          message: 'That phone number is already linked to an account.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'An account with those details already exists. Please check your information.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again in a moment.'
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
