ALTER TABLE "lesson_notes" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "prompt_used" text;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "provider_used" varchar(20);--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "visual_aids";--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "review_notes";--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "download_url";--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "term";--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "session_year";--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "prompt_version";