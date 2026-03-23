import { getWallet, getTransactions, createWallet } from '../services/walletService.js';

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
    const { walletType } = req.query;

    const transactions = await getTransactions(userId, walletType);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions.',
    });
  }
};

export default {
  getUserWallet,
  getUserTransactions,
};
