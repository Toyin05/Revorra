import prisma from '../config/prisma.js';

/**
 * Credit game reward to user's OneHub wallet
 * Ensures atomic transaction with proper validation
 * @param {string} userId - User's ID
 * @param {number} reward - Reward amount
 * @param {string} gameType - Type of game (SPIN, TICTACTOE)
 * @param {string} gameSessionId - Unique session ID to prevent duplicates
 */
export async function creditGameReward(userId, reward, gameType, gameSessionId) {
  // Validate reward
  if (reward < 0) {
    throw new Error('Reward cannot be negative');
  }

  if (reward > 0.5) {
    throw new Error('Reward cannot exceed €0.5');
  }

  // Skip if no reward
  if (reward <= 0) {
    return null;
  }

  // Check for duplicate reward within last 60 seconds
  const recentTransaction = await prisma.transaction.findFirst({
    where: {
      userId,
      type: 'GAME_REWARD',
      description: {
        contains: gameType
      },
      createdAt: {
        gte: new Date(Date.now() - 60000) // Last 60 seconds
      }
    }
  });

  if (recentTransaction) {
    console.log(`Duplicate reward detected for user ${userId}, game ${gameType}`);
    return null;
  }

  // Process reward in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Credit wallet
    const wallet = await tx.wallet.update({
      where: { userId },
      data: {
        onehubBalance: {
          increment: reward
        }
      }
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount: reward,
        type: 'GAME_REWARD',
        walletType: 'ONEHUB',
        description: `${gameType} reward - Session: ${gameSessionId}`,
        status: 'COMPLETED'
      }
    });

    return { wallet, transaction };
  });

  return result;
}

export default {
  creditGameReward
};
