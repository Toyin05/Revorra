import vtuService from '../services/vtuService.js';

/**
 * Get data plans for a specific network
 */
export const getDataPlansHandler = async (req, res) => {
  try {
    const { network } = req.params;

    // Validate network parameter
    const validNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
    if (!validNetworks.includes(network.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network. Must be one of: mtn, airtel, glo, 9mobile',
      });
    }

    const plans = await vtuService.getDataPlans(network);

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Get data plans error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get data plans.',
    });
  }
};

/**
 * Purchase airtime
 */
export const purchaseAirtimeHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { network, phoneNumber, amount } = req.body;

    // Validate required fields
    if (!network || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'network, phoneNumber, and amount are required.',
      });
    }

    // Validate network
    const validNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
    if (!validNetworks.includes(network.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network. Must be one of: mtn, airtel, glo, 9mobile',
      });
    }

    // Validate phone number format (10 digits for Nigeria)
    if (!/^\d{10,11}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be 10-11 digits.',
      });
    }

    // Validate amount
    if (amount < 50 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between ₦50 and ₦50,000.',
      });
    }

    const result = await vtuService.purchaseAirtime(userId, network, phoneNumber, amount);

    if (result.response?.code === '000' || result.response?.content?.transactions?.status === 'delivered') {
      return res.status(201).json({
        success: true,
        message: 'Airtime purchased successfully',
        data: {
          requestId: result.requestId,
          amount: amount,
          phoneNumber: phoneNumber,
          network: network,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to purchase airtime. Please try again.',
      });
    }
  } catch (error) {
    console.error('Purchase airtime error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to purchase airtime.',
    });
  }
};

/**
 * Purchase data
 */
export const purchaseDataHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { network, phoneNumber, planCode, amount } = req.body;

    // Validate required fields
    if (!network || !phoneNumber || !planCode || !amount) {
      return res.status(400).json({
        success: false,
        message: 'network, phoneNumber, planCode, and amount are required.',
      });
    }

    // Validate network
    const validNetworks = ['mtn', 'airtel', 'glo', '9mobile'];
    if (!validNetworks.includes(network.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network. Must be one of: mtn, airtel, glo, 9mobile',
      });
    }

    // Validate phone number format
    if (!/^\d{10,11}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be 10-11 digits.',
      });
    }

    // Validate amount
    if (amount < 50 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between ₦50 and ₦50,000.',
      });
    }

    const result = await vtuService.purchaseData(userId, network, phoneNumber, planCode, amount);

    if (result.response?.code === '000' || result.response?.content?.transactions?.status === 'delivered') {
      return res.status(201).json({
        success: true,
        message: 'Data purchased successfully',
        data: {
          requestId: result.requestId,
          phoneNumber: phoneNumber,
          network: network,
          planCode: planCode,
          amount: amount,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to purchase data. Please try again.',
      });
    }
  } catch (error) {
    console.error('Purchase data error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to purchase data.',
    });
  }
};

/**
 * Get VTU transaction history
 */
export const getVtuHistoryHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const result = await vtuService.getVtuHistory(userId, limitNum, pageNum);

    return res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get VTU history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get VTU history.',
    });
  }
};

export default {
  getDataPlansHandler,
  purchaseAirtimeHandler,
  purchaseDataHandler,
  getVtuHistoryHandler,
};