import { getWallet, getTransactions, createWallet } from '../services/walletService.js';
import prisma from '../config/prisma.js';

/**
 * Get user's wallet
 */
export const getUserWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await getWallet(userId);

    return res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get wallet.',
    });
  }
};

/**
 * Get user's transactions
 */
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getUserWallet,
  getUserTransactions,
};
