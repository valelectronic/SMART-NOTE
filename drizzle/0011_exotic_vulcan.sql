ALTER TABLE "profile_settings" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "teaching_level" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "full_name" varchar(255) NOT NULL;