import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getTasks, getTask, complete, getHistory } from '../controllers/taskController.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// GET /api/tasks - Get all active tasks (protected)
router.get('/', authenticateToken, getTasks);

// GET /api/tasks/history - Get user's task history (protected)
router.get('/history', authenticateToken, getHistory);

// GET /api/tasks/:taskId - Get task by ID (protected)
router.get('/:taskId', authenticateToken, getTask);

// POST /api/tasks/:id/complete - Complete a task (protected)
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { proof } = req.body;

    if (!proof || proof.trim() === '') {
      return res.status(400).json({ success: false, message: 'Proof is required.' });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (!task.isActive) return res.status(400).json({ success: false, message: 'Task is no longer active.' });

    // Check if already completed (APPROVED)
    const existing = await prisma.taskCompletion.findFirst({
      where: { taskId: id, userId, status: 'APPROVED' }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already completed this task.' });
    }

    // Create completion with APPROVED status immediately
    const completion = await prisma.taskCompletion.create({
      data: {
        taskId: id,
        userId,
        proof,
        status: 'APPROVED',
        verifiedAt: new Date()
      }
    });

    // Credit wallet immediately
    await prisma.wallet.update({
      where: { userId },
      data: {
        taskBalance: {
          increment: task.reward
        }
      }
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'TASK_REWARD',
        amount: task.reward,
        description: `Task completed: ${task.title}`,
        walletType: 'TASK',
      }
    });

    const updatedWallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    return res.status(200).json({
      success: true,
      message: 'Task reward added to your balance successfully',
      data: { wallet: updatedWallet }
    });

  } catch (error) {
    console.error('Task completion error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tasks/:id/verify - Verify task completion (placeholder)
router.get('/:id/verify', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Verify task endpoint not yet implemented',
  });
});

export default router;
