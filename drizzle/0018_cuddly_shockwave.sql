ALTER TABLE "scheme_sub_topics" ALTER COLUMN "performance_objectives" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scheme_sub_topics" ADD COLUMN "topic_content" text NOT NULL;