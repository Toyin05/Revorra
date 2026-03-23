import prisma from '../config/prisma.js';

// Referral reward percentages
const LEVEL_1_REWARD_PERCENTAGE = 0.10; // 10% for direct referrer
const LEVEL_2_REWARD_PERCENTAGE = 0.05; // 5% for indirect referrer

/**
 * Distribute referral rewards to referrers when a user earns from a task
 * Level 1: Direct referrer gets 10%
 * Level 2: Indirect referrer gets 5%
 * 
 * @param {string} userId - The user who completed the task
 * @param {number} taskReward - The reward amount from the task
 */
export const distributeReferralRewards = async (userId, taskReward) => {
  try {
    // Step 1: Find the user who completed the task
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, referredBy: true }
    });

    if (!user) {
      console.log(`Referral: User ${userId} not found`);
      return;
    }

    // Step 2: Check if user has a referrer
    if (!user.referredBy) {
      console.log(`Referral: User ${user.username} has no referrer`);
      return;
    }

    // Prevent self-referral
    if (user.referredBy === userId) {
      console.log(`Referral: Self-referral detected for user ${user.username}, skipping`);
      return;
    }

    // Step 3: Pay Direct Referrer (Level 1)
    // Note: user.referredBy stores the username, not the user ID
    const directReferrer = await prisma.user.findUnique({
      where: { username: user.referredBy },
      select: { id: true, username: true, referredBy: true }
    });

    if (directReferrer) {
      const level1Reward = taskReward * LEVEL_1_REWARD_PERCENTAGE;

      // Prevent self-referral
      if (directReferrer.id !== userId) {
        // Update wallet
        await prisma.wallet.update({
          where: { userId: directReferrer.id },
          data: {
            referralBalance: { increment: level1Reward }
          }
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: directReferrer.id,
            walletType: 'REFERRAL',
            type: 'REFERRAL_REWARD',
            amount: level1Reward,
            description: `Level 1 referral reward from ${user.username}`,
            status: 'COMPLETED'
          }
        });

        console.log(`Referral reward distributed:`);
        console.log(`  Referrer: ${directReferrer.username}`);
        console.log(`  Amount: €${level1Reward.toFixed(2)}`);
        console.log(`  Source: ${user.username}`);
      }

      // Step 4: Pay Indirect Referrer (Level 2)
      // Note: directReferrer.referredBy stores the username
      if (directReferrer.referredBy && directReferrer.referredBy !== userId) {
        const indirectReferrer = await prisma.user.findUnique({
          where: { username: directReferrer.referredBy },
          select: { id: true, username: true }
        });

        if (indirectReferrer) {
          const level2Reward = taskReward * LEVEL_2_REWARD_PERCENTAGE;

          // Prevent circular referral
          if (indirectReferrer.id !== userId) {
            // Update wallet
            await prisma.wallet.update({
              where: { userId: indirectReferrer.id },
              data: {
                referralBalance: { increment: level2Reward }
              }
            });

            // Create transaction record
            await prisma.transaction.create({
              data: {
                userId: indirectReferrer.id,
                walletType: 'REFERRAL',
                type: 'REFERRAL_REWARD',
                amount: level2Reward,
                description: `Level 2 referral reward from ${user.username}`,
                status: 'COMPLETED'
              }
            });

            console.log(`Referral reward distributed:`);
            console.log(`  Indirect Referrer: ${indirectReferrer.username}`);
            console.log(`  Amount: €${level2Reward.toFixed(2)}`);
            console.log(`  Source: ${user.username}`);
          }
        }
      }
    }

    console.log(`Referral: Completed for user ${user.username}, reward €${taskReward}`);
  } catch (error) {
    console.error('Referral payout error:', error);
    // Do NOT throw - task approval should not fail due to referral issues
  }
};

export default {
  distributeReferralRewards
};
