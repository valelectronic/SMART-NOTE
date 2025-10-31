ALTER TABLE "onboarding" ALTER COLUMN "school_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."school_type";--> statement-breakpoint
CREATE TYPE "public"."school_type" AS ENUM('government', 'private', 'mission');--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "school_type" SET DATA TYPE "public"."school_type" USING "school_type"::"public"."school_type";--> statement-breakpoint
ALTER TABLE "profile_settings" DROP COLUMN "approval_status";