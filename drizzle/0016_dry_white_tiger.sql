CREATE TYPE "public"."sow_processing_status" AS ENUM('pending', 'processing', 'complete', 'failed');--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "sow_processing_status" "sow_processing_status" DEFAULT 'complete' NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "sow_error_message" text;