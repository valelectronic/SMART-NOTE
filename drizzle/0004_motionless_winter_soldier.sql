CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "profile_settings" ALTER COLUMN "is_approved" SET DEFAULT 'pending'::"public"."approval_status";--> statement-breakpoint
ALTER TABLE "profile_settings" ALTER COLUMN "is_approved" SET DATA TYPE "public"."approval_status" USING "is_approved"::"public"."approval_status";