ALTER TYPE "public"."sow_processing_status" ADD VALUE 'idle';--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "sow_processing_status" DROP NOT NULL;