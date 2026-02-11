ALTER TABLE "lesson_notes" ADD COLUMN "original_content" text;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "edit_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "last_correction_instruction" text;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "last_generated_at" timestamp DEFAULT now();