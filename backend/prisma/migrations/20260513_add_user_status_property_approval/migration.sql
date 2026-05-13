-- Add status field to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ban_reason" TEXT;

-- Add status field to properties table  
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- Add terminate reason to contracts
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "terminate_reason" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "terminated_at" TIMESTAMP;
