-- Add generated_for column to coupons table if it doesn't exist
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "generated_for" TEXT;