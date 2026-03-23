import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getTasks, getTask, complete, getHistory } from '../controllers/taskController.js';

const router = express.Router();

// GET /api/tasks - Get all active tasks (protected)
router.get('/', authenticateToken, getTasks);

// GET /api/tasks/history - Get user's task history (protected)
router.get('/history', authenticateToken, getHistory);

// GET /api/tasks/:taskId - Get task by ID (protected)
router.get('/:taskId', authenticateToken, getTask);

// POST /api/tasks/:taskId/complete - Complete a task (protected)
router.post('/:taskId/complete', authenticateToken, complete);

// GET /api/tasks/:id/verify - Verify task completion (placeholder)
router.get('/:id/verify', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Verify task endpoint not yet implemented',
  });
});

export default router;
