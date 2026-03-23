import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { 
  eurToNgn, 
  ngnToEur,
  checkTWBalance, 
  getDataPlans, 
  purchaseAirtime, 
  purchaseData,
  requeryTransaction,
  validateMobile
} from '../services/vtuService.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// GET /api/vtu/tw-balance
router.get('/tw-balance', authenticateToken, async (req, res) => {
  try {
    const balance = await checkTWBalance();
    return res.status(200).json({ success: true, data: balance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/vtu/data-plans/:network
router.get('/data-plans/:network', authenticateToken, async (req, res) => {
  try {
    const { network } = req.params;
    const plans = await getDataPlans(network);
    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/vtu/validate-mobile
router.post('/validate-mobile', authenticateToken, async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) return res.status(400).json({ success: false, message: 'Mobile number is required' });
    const result = await validateMobile(mobileNumber);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/vtu/airtime
router.post('/airtime', authenticateToken, async (req, res) => {
  try {
    const { network, phoneNumber, amount } = req.body;
    const userId = req.user.id;

    if (!network || !phoneNumber || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'network, phoneNumber, and amount are required.' 
      });
    }

    const amountEUR = parseFloat(amount);
    const amountNGN = eurToNgn(amountEUR);

    if (amountNGN < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum airtime amount is ₦50' 
      });
    }

    // Check user OneHub wallet balance
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.onehubBalance < amountEUR) {
      return res.status(400).json({
        success: false,
        message: `Insufficient OneHub balance. You need €${amountEUR} but have €${wallet?.onehubBalance || 0}`
      });
    }

    // Call TopupWizard API
    const { clientReference, response: twResponse } = await purchaseAirtime(
      network,
      phoneNumber,
      amountNGN
    );

    const isSuccess = twResponse?.status === 'success';
    const status = isSuccess ? 'SUCCESS' : 'FAILED';

    // Deduct from wallet immediately if success
    if (isSuccess) {
      await prisma.wallet.update({
        where: { userId },
        data: { onehubBalance: { decrement: amountEUR } }
      });

      await prisma.transaction.create({
        data: {
          userId,
          walletType: 'ONEHUB',
          type: 'VTU_PURCHASE',
          amount: amountEUR,
          description: `${network.toUpperCase()} Airtime ₦${amountNGN} → ${phoneNumber}`,
          status: 'COMPLETED'
        }
      });
    }

    // Record VTU transaction
    const vtuTransaction = await prisma.vTUTransaction.create({
      data: {
        userId,
        phone: phoneNumber,
        network: network.toUpperCase(),
        amount: amountEUR,
        type: 'AIRTIME',
        status,
        providerRef: clientReference,
        providerResponse: JSON.stringify(twResponse)
      }
    });

    return res.status(200).json({
      success: isSuccess,
      message: isSuccess 
        ? `✅ Airtime of ₦${amountNGN} sent to ${phoneNumber} successfully` 
        : `❌ Airtime purchase failed: ${twResponse?.message || 'Unknown error'}`,
      data: {
        id: vtuTransaction.id,
        amountEUR,
        amountNGN,
        network: network.toUpperCase(),
        phoneNumber,
        reference: twResponse?.data?.reference,
        status
      }
    });

  } catch (error) {
    console.error('VTU airtime error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/vtu/data
router.post('/data', authenticateToken, async (req, res) => {
  try {
    const { network, phoneNumber, serviceID, planName, amountNGN } = req.body;
    const userId = req.user.id;

    if (!network || !phoneNumber || !serviceID || !amountNGN) {
      return res.status(400).json({ 
        success: false, 
        message: 'network, phoneNumber, serviceID, and amountNGN are required.' 
      });
    }

    const amountEUR = ngnToEur(parseFloat(amountNGN));

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.onehubBalance < amountEUR) {
      return res.status(400).json({
        success: false,
        message: `Insufficient OneHub balance. You need €${amountEUR.toFixed(2)} but have €${wallet?.onehubBalance || 0}`
      });
    }

    // Call TopupWizard API
    const { clientReference, response: twResponse } = await purchaseData(
      phoneNumber,
      parseInt(serviceID)
    );

    const isSuccess = twResponse?.status === 'success';
    const status = isSuccess ? 'SUCCESS' : 'FAILED';

    // Deduct from wallet if success
    if (isSuccess) {
      await prisma.wallet.update({
        where: { userId },
        data: { onehubBalance: { decrement: amountEUR } }
      });

      await prisma.transaction.create({
        data: {
          userId,
          walletType: 'ONEHUB',
          type: 'VTU_PURCHASE',
          amount: amountEUR,
          description: `${network.toUpperCase()} Data ${planName || ''} → ${phoneNumber}`,
          status: 'COMPLETED'
        }
      });
    }

    // Record VTU transaction
    const vtuTransaction = await prisma.vTUTransaction.create({
      data: {
        userId,
        phone: phoneNumber,
        network: network.toUpperCase(),
        amount: amountEUR,
        type: 'DATA',
        status,
        providerRef: clientReference,
        providerResponse: JSON.stringify(twResponse)
      }
    });

    return res.status(200).json({
      success: isSuccess,
      message: isSuccess 
        ? `✅ Data plan sent to ${phoneNumber} successfully`
        : `❌ Data purchase failed: ${twResponse?.message || 'Unknown error'}`,
      data: {
        id: vtuTransaction.id,
        amountEUR,
        amountNGN,
        network: network.toUpperCase(),
        phoneNumber,
        planName,
        reference: twResponse?.data?.reference,
        status
      }
    });

  } catch (error) {
    console.error('VTU data error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/vtu/webhook - TopupWizard sends real-time status here
router.post('/webhook', async (req, res) => {
  try {
    const { status, data } = req.body;
    const { clientReference } = data || {};

    if (clientReference) {
      const transaction = await prisma.vTUTransaction.findFirst({
        where: { providerRef: clientReference }
      });

      if (transaction) {
        const newStatus = status === 'success' ? 'SUCCESS' : 'FAILED';

        await prisma.vTUTransaction.update({
          where: { id: transaction.id },
          data: { 
            status: newStatus, 
            providerResponse: JSON.stringify(req.body) 
          }
        });

        // Refund user if transaction failed
        if (status === 'failed' && transaction.status !== 'FAILED') {
          await prisma.wallet.update({
            where: { userId: transaction.userId },
            data: { onehubBalance: { increment: transaction.amount } }
          });

          console.log(`Refunded €${transaction.amount} to user ${transaction.userId} for failed VTU transaction`);
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('VTU webhook error:', error);
    return res.status(500).json({ success: false });
  }
});

// GET /api/vtu/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.vTUTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.vTUTransaction.count({ where: { userId } })
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
