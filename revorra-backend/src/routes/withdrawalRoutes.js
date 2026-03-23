import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requestWithdrawalHandler, getWithdrawalHistoryHandler } from '../controllers/withdrawalController.js';

const router = express.Router();

// POST /api/withdrawals - Request withdrawal
router.post('/', authenticateToken, requestWithdrawalHandler);

// GET /api/withdrawals/history - Get user's withdrawal history
router.get('/history', authenticateToken, getWithdrawalHistoryHandler);

export default router;
