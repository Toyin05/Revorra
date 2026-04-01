import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;
    
    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get unread count
    const unreadCount = await prisma.userNotification.count({
      where: { userId, isRead: false }
    });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications.',
    });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.userNotification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    await prisma.userNotification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read.',
    });
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read.',
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.userNotification.deleteMany({
      where: { id, userId }
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted.'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification.',
    });
  }
});

export default router;