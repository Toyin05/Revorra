-- Make user_id nullable in coupons table
ALTER TABLE "coupons" ALTER COLUMN "user_id" DROP NOT NULL;