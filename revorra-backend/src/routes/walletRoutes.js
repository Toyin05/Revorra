import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getUserWallet, getUserTransactions } from '../controllers/walletController.js';

const router = express.Router();

// GET /api/wallet - Get user's wallet
router.get('/', authenticateToken, getUserWallet);

// GET /api/wallet/transactions - Get user's transactions
router.get('/transactions', authenticateToken, getUserTransactions);

export default router;
