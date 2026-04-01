import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import prisma from '../config/prisma.js';
import { creditGameReward } from '../services/gameRewardService.js';

const router = express.Router();

// Daily play limits
const DAILY_LIMITS = {
  SPIN: 2,
  TICTACTOE: 2
};

// Helper function to get today's play count for a specific game
async function getTodayPlayCount(userId, gameType) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await prisma.gamePlay.count({
    where: {
      userId,
      gameType,
      playedAt: {
        gte: todayStart
      }
    }
  });

  return count;
}

// Weighted reward pool for Spin the Wheel - Better odds!
const SPIN_REWARDS = [
  { value: 0, weight: 25 },    // 25% - reduced from 40%
  { value: 0.20, weight: 35 },  // 35% - increased
  { value: 0.25, weight: 20 },  // 20% - increased
  { value: 0.30, weight: 10 },   // 10%
  { value: 0.35, weight: 5 },   // 5%
  { value: 0.40, weight: 3 },   // 3% - rare
  { value: 0.50, weight: 2 }   // 2% - very rare
];

// Function to get weighted random reward
function getSpinReward() {
  const totalWeight = SPIN_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const reward of SPIN_REWARDS) {
    cumulative += reward.weight;
    if (random <= cumulative) {
      return reward.value;
    }
  }
  return 0;
}

// Generate unique session ID
function generateSessionId() {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// GET /api/games - Get all games
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get games endpoint not yet implemented',
  });
});

// GET /api/games/spin/status - Get spin game status
router.get('/spin/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playCount = await prisma.gamePlay.count({
      where: {
        userId,
        gameType: 'SPIN',
        playedAt: { gte: today }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        playsUsed: playCount,
        playsRemaining: Math.max(0, 2 - playCount),
        canPlay: playCount < 2
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/games/tictactoe/status - Get tic-tac-toe game status
router.get('/tictactoe/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    const playCount = await prisma.gamePlay.count({
      where: {
        userId,
        gameType: 'TICTACTOE',
        playedAt: { gte: today }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        playsUsed: playCount,
        playsRemaining: Math.max(0, 2 - playCount),
        canPlay: playCount < 2
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/games/spin - Spin the wheel (protected, limited to 2 per day)
router.post('/spin', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const gameType = 'SPIN';
    const dailyLimit = DAILY_LIMITS[gameType];

    // Check daily play count
    const playCount = await getTodayPlayCount(userId, gameType);

    if (playCount >= dailyLimit) {
      return res.status(400).json({
        success: false,
        message: `Daily ${gameType.toLowerCase()} limit reached. You can play ${dailyLimit} times per day.`,
        remainingPlays: 0
      });
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Generate session ID for duplicate prevention
    const sessionId = generateSessionId();

    // Get spin reward from backend (NOT frontend)
    const reward = getSpinReward();

    // Credit reward securely using the service
    if (reward > 0) {
      await creditGameReward(userId, reward, gameType, sessionId);
    }

    // Record game play
    await prisma.gamePlay.create({
      data: {
        userId,
        gameType,
        reward: reward
      }
    });

    // Get updated wallet balance
    const updatedWallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    const remainingPlays = dailyLimit - playCount - 1;

    return res.status(200).json({
      success: true,
      data: {
        reward: reward,
        remainingPlays: Math.max(0, remainingPlays),
        oneHubBalance: updatedWallet?.onehubBalance || 0,
        message: reward > 0 ? `You won €${reward}!` : 'Better luck next time!'
      }
    });
  } catch (error) {
    console.error('Spin error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to spin wheel'
    });
  }
});

// POST /api/games/tictactoe - Play tic-tac-toe (protected, limited to 2 per day)
router.post('/tictactoe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { board } = req.body; // Board state passed from frontend
    const gameType = 'TICTACTOE';
    const dailyLimit = DAILY_LIMITS[gameType];

    // Check daily play count
    const playCount = await getTodayPlayCount(userId, gameType);

    if (playCount >= dailyLimit) {
      return res.status(400).json({
        success: false,
        message: `Daily ${gameType.toLowerCase()} limit reached. You can play ${dailyLimit} times per day.`,
        remainingPlays: 0
      });
    }

    // Generate session ID for duplicate prevention
    const sessionId = generateSessionId();

    // Determine game result based on board state
    let result = 'draw';
    let reward = 0;

    // Simple win detection - check if X (player) won
    const checkWinner = (boardState) => {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const [a,b,c] of lines) {
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
          return boardState[a];
        }
      }
      return null;
    };

    if (board && Array.isArray(board)) {
      const winner = checkWinner(board);
      if (winner === 'X') {
        result = 'win';
        // Weighted reward: €0.20 (45%), €0.25 (25%), €0.30 (15%), €0.40 (10%), €0.50 (5%)
        const TICTACTOE_REWARDS = [
          { value: 0.20, weight: 45 },
          { value: 0.25, weight: 25 },
          { value: 0.30, weight: 15 },
          { value: 0.40, weight: 10 },
          { value: 0.50, weight: 5 }
        ];
        const totalWeight = TICTACTOE_REWARDS.reduce((sum, r) => sum + r.weight, 0);
        const random = Math.random() * totalWeight;
        let cumulative = 0;
        for (const r of TICTACTOE_REWARDS) {
          cumulative += r.weight;
          if (random <= cumulative) {
            reward = r.value;
            break;
          }
        }
      } else if (winner === 'O') {
        result = 'loss';
      } else if (board.every(cell => cell !== null)) {
        result = 'draw';
      }
    }

    // Credit reward if player won
    if (reward > 0) {
      await creditGameReward(userId, reward, gameType, sessionId);
    }

    // Record game play
    await prisma.gamePlay.create({
      data: {
        userId,
        gameType,
        reward: reward
      }
    });

    // Get updated wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    const remainingPlays = dailyLimit - playCount - 1;

    return res.status(200).json({
      success: true,
      data: {
        result: result,
        reward: reward,
        remainingPlays: Math.max(0, remainingPlays),
        oneHubBalance: wallet?.onehubBalance || 0
      }
    });
  } catch (error) {
    console.error('Tic-tac-toe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to play tic-tac-toe'
    });
  }
});

// POST /api/games/tictactoe/result - Submit tic-tac-toe result (with reward for win)
router.post('/tictactoe/result', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { result } = req.body; // 'win', 'loss', 'draw'
    
    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Result is required'
      });
    }

    // Reward only on win - €0.3 for win
    let reward = 0;
    if (result === 'win') {
      reward = 0.3;
    }

    // Generate session ID for duplicate prevention
    const sessionId = generateSessionId();

    // Credit reward securely using the service
    if (reward > 0) {
      await creditGameReward(userId, reward, 'TICTACTOE', sessionId);
    }

    // Get updated wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    return res.status(200).json({
      success: true,
      data: {
        result: result,
        reward: reward,
        oneHubBalance: wallet?.onehubBalance || 0
      }
    });
  } catch (error) {
    console.error('Tic-tac-toe result error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit tic-tac-toe result'
    });
  }
});

// GET /api/games/history - Get game history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const gamePlays = await prisma.gamePlay.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: 50
    });

    return res.status(200).json({
      success: true,
      data: gamePlays
    });
  } catch (error) {
    console.error('Get game history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get game history'
    });
  }
});

export default router;
