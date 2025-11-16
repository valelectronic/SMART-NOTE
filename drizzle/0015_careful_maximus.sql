ALTER TABLE "onboarding" ADD COLUMN "sow_title" varchar(255);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "sow_uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "sow_file_key" text;--> statement-breakpoint
ALTER TABLE "scheme_sub_topics" ADD COLUMN "performance_objectives" text NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "scheme_of_work_url";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "scheme_extracted";--> statement-breakpoint
ALTER TABLE "scheme_sub_topics" DROP COLUMN "sub_topics_detail";