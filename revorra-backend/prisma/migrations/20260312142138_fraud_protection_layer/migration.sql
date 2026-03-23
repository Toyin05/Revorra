-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'TASK_COMPLETION', 'WITHDRAWAL_REQUEST', 'SIGNUP');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "device_fingerprint" TEXT,
ADD COLUMN     "fraud_reason" TEXT,
ADD COLUMN     "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_login_ip" TEXT,
ADD COLUMN     "referral_signup_ip" TEXT,
ADD COLUMN     "signup_ip" TEXT;

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "ActivityType" NOT NULL,
    "ip_address" TEXT,
    "device_fingerprint" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activities_user_id_idx" ON "user_activities"("user_id");

-- CreateIndex
CREATE INDEX "user_activities_action_idx" ON "user_activities"("action");

-- CreateIndex
CREATE INDEX "user_activities_created_at_idx" ON "user_activities"("created_at");

-- CreateIndex
CREATE INDEX "user_activities_ip_address_idx" ON "user_activities"("ip_address");

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
