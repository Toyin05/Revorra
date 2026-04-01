import express from 'express';
import prisma from '../config/prisma.js';

const router = express.Router();

// GET /api/announcements/active - Fetch active announcements (public)
router.get('/active', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        message: true,
        image: true,
        ctaLink: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch announcements.',
    });
  }
});

// GET /api/settings/coupon-link - Get coupon request redirect link (public)
router.get('/coupon-link', async (req, res) => {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'COUPON_REQUEST_LINK' }
    });
    return res.status(200).json({
      success: true,
      data: { link: setting?.value || 'https://wa.me/your-number' }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
