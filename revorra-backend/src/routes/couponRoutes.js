import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Coupon pricing configuration
const COUPON_PRICING = {
  TASK: 1500,
  REFERRAL: 2000,
  ONEHUB: 1500
};

const MIN_WITHDRAWAL = {
  TASK: 89,
  REFERRAL: 35,
  ONEHUB: 16
};

// POST /api/coupons/request - Request a coupon for withdrawal
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;

    // Validate type
    if (!type || !['TASK', 'REFERRAL', 'ONEHUB'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be TASK, REFERRAL, or ONEHUB'
      });
    }

    // Get user with wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check wallet balance based on type
    let balance;
    switch (type) {
      case 'TASK':
        balance = user.wallet.taskBalance;
        break;
      case 'REFERRAL':
        balance = user.wallet.referralBalance;
        break;
      case 'ONEHUB':
        balance = user.wallet.onehubBalance;
        break;
      default:
        balance = 0;
    }

    // Check minimum threshold
    if (balance < MIN_WITHDRAWAL[type]) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal not reached. Current: ₦${balance}, Required: ₦${MIN_WITHDRAWAL[type]}`
      });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.couponRequest.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request'
      });
    }

    // Create coupon request
    const request = await prisma.couponRequest.create({
      data: {
        userId,
        type,
        amount: COUPON_PRICING[type]
      }
    });

    // Return payment details
    res.status(201).json({
      success: true,
      data: {
        requestId: request.id,
        amount: COUPON_PRICING[type],
        bankName: 'Opay',
        accountNumber: '9011649326',
        accountName: 'Revorra Services'
      }
    });

  } catch (error) {
    console.error('Coupon request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/coupons/my-requests - Get user's own coupon requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.couponRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Return only required fields
    const formattedRequests = requests.map(request => ({
      id: request.id,
      type: request.type,
      amount: request.amount,
      status: request.status,
      proofImage: request.proofImage,
      couponCode: request.couponCode,
      createdAt: request.createdAt
    }));

    res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Get my coupon requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/coupons/user-coupons - Get user's approved coupons for redemption
router.get('/user-coupons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get approved coupon requests that can be redeemed
    const coupons = await prisma.couponRequest.findMany({
      where: { 
        userId,
        status: 'APPROVED',
        couponCode: { not: null }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Return only required fields
    const formattedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      type: coupon.type,
      amount: coupon.amount,
      status: coupon.status,
      couponCode: coupon.couponCode,
      createdAt: coupon.createdAt
    }));

    res.json({
      success: true,
      data: formattedCoupons
    });
  } catch (error) {
    console.error('Get user coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/coupons - Get user's coupon requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.couponRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get coupon requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/coupons/history - Get coupon redemption history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await prisma.couponRequest.findMany({
      where: { 
        userId,
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get coupon history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/coupons/upload-proof - Upload payment proof image
router.post('/upload-proof', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId, proofImage } = req.body;

    // Validate required fields
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    if (!proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Proof image is required'
      });
    }

    // Check if request exists
    const couponRequest = await prisma.couponRequest.findUnique({
      where: { id: requestId }
    });

    if (!couponRequest) {
      return res.status(404).json({
        success: false,
        message: 'Coupon request not found'
      });
    }

    // Ensure request belongs to logged-in user
    if (couponRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload proof for this request'
      });
    }

    // Ensure status is still PENDING
    if (couponRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Prevent duplicate upload
    if (couponRequest.proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Proof already submitted'
      });
    }

    // Validate file type (must be valid image base64)
    const validImageTypes = [
      'data:image/jpeg',
      'data:image/png',
      'data:image/jpg',
      'data:image/webp'
    ];

    const isValidType = validImageTypes.some(type => proofImage.startsWith(type));
    
    if (!isValidType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Supported formats: JPEG, PNG, JPG, WEBP'
      });
    }

    // Validate size (max 5MB)
    // Base64 string is ~37% larger than original
    const maxBase64Size = 5 * 1024 * 1024 * 1.37; // ~6.85MB as base64
    
    if (proofImage.length > maxBase64Size) {
      return res.status(400).json({
        success: false,
        message: 'Image size too large. Maximum allowed is 5MB'
      });
    }

    // Update coupon request with proof image
    await prisma.couponRequest.update({
      where: { id: requestId },
      data: {
        proofImage: proofImage
      }
    });

    res.json({
      success: true,
      message: 'Proof uploaded successfully. Awaiting admin approval.'
    });

  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/coupons/redeem - Redeem coupon to unlock withdrawal
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    // Find coupon request by couponCode field
    const couponRequest = await prisma.couponRequest.findFirst({
      where: { 
        couponCode: code,
        userId: userId
      }
    });

    if (!couponRequest) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (couponRequest.status === 'REDEEMED') {
      return res.status(400).json({ success: false, message: 'Coupon already redeemed' });
    }

    if (couponRequest.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Coupon must be approved before redemption' });
    }

    // Mark coupon request as redeemed
    await prisma.couponRequest.update({
      where: { id: couponRequest.id },
      data: { status: 'REDEEMED' }
    });

    // Unlock withdrawal for this wallet type
    const updateData = {};
    if (couponRequest.type === 'TASK') updateData.canWithdrawTask = true;
    if (couponRequest.type === 'REFERRAL') updateData.canWithdrawReferral = true;
    if (couponRequest.type === 'ONEHUB') updateData.canWithdrawOnehub = true;

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: 'Coupon redeemed successfully. Withdrawal unlocked.'
    });

  } catch (error) {
    console.error('Redeem coupon error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
