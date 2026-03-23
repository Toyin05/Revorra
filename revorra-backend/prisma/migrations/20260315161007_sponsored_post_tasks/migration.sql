-- Add NORMAL_TASK to TaskType enum
ALTER TYPE "TaskType" ADD VALUE 'NORMAL_TASK';

-- Add SPONSORED_POST_REWARD to TransactionType enum
ALTER TYPE "TransactionType" ADD VALUE 'SPONSORED_POST_REWARD';

-- Add new columns to Task table
ALTER TABLE "tasks" ADD COLUMN "share_link" TEXT;
ALTER TABLE "tasks" ADD COLUMN "share_message" TEXT;
ALTER TABLE "tasks" ADD COLUMN "daily_limit" INTEGER NOT NULL DEFAULT 1;

-- Add SPONSORED_POST_REWARD to REWARD_TYPES if needed (this is application code, not DB)
