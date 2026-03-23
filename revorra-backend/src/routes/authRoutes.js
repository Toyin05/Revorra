import express from 'express';
import bcrypt from 'bcrypt';
import { register, login, me, getReferrals } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

// POST /register - User registration
router.post('/register', register);

// POST /login - User login
router.post('/login', login);

// POST /admin/register - Admin registration
router.post('/admin/register', async (req, res) => {
  try {
    const { email, password, username, deviceFingerprint } = req.body;

    // Validate all fields are present
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and username are required.',
      });
    }

    // Check email and username are unique
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists.',
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get client IP and user agent
    const ipAddress = req.metadata?.ip || req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create admin user with role: ADMIN
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        referralCode: username,
        role: 'ADMIN',
        isVerified: true,
        isSuspended: false,
        signupIP: ipAddress,
        deviceFingerprint: deviceFingerprint || null,
      },
    });

    // Create wallet for the admin
    await prisma.wallet.create({
      data: {
        userId: user.id,
        referralBalance: 0,
        taskBalance: 0,
        onehubBalance: 0,
        lockedReferralBalance: 0,
        lockedTaskBalance: 0,
        lockedOnehubBalance: 0,
      },
    });

    // Save device record
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

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Admin registration failed.',
    });
  }
});

// GET /me - Get current user (protected)
router.get('/me', authenticateToken, me);

// GET /referrals - Get referral stats (protected)
router.get('/referrals', authenticateToken, getReferrals);

// POST /api/auth/logout - User logout (placeholder)
router.post('/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// POST /api/auth/forgot-password - Password reset request (placeholder)
router.post('/auth/forgot-password', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Forgot password endpoint not yet implemented',
  });
});

// POST /api/auth/reset-password - Password reset (placeholder)
router.post('/auth/reset-password', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Reset password endpoint not yet implemented',
  });
});

// POST /api/auth/verify-email - Email verification (placeholder)
router.post('/auth/verify-email', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Email verification endpoint not yet implemented',
  });
});

export default router;
