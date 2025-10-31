CREATE TABLE "scheme_sub_topics" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_week_id" varchar(36) NOT NULL,
	"topic_title" text NOT NULL,
	"sub_topics_detail" text,
	"extracted_from" text,
	"notes_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_weeks" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onboarding_id" varchar(36) NOT NULL,
	"week_number" integer NOT NULL,
	"term" varchar(20),
	"reviewed" boolean DEFAULT false,
	"approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheme_topics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "scheme_topics" CASCADE;--> statement-breakpoint
-- ALTER TABLE "lesson_notes" DROP CONSTRAINT "lesson_notes_scheme_topic_id_scheme_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_settings" ADD COLUMN "approval_status" "approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "onboarding_id" varchar(36);--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "scheme_sub_topic_id" varchar(36);--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD COLUMN "completion_status" "completion_status" DEFAULT 'incomplete';--> statement-breakpoint
ALTER TABLE "scheme_sub_topics" ADD CONSTRAINT "scheme_sub_topics_scheme_week_id_scheme_weeks_id_fk" FOREIGN KEY ("scheme_week_id") REFERENCES "public"."scheme_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_weeks" ADD CONSTRAINT "scheme_weeks_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_scheme_sub_topic_id_scheme_sub_topics_id_fk" FOREIGN KEY ("scheme_sub_topic_id") REFERENCES "public"."scheme_sub_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_settings" DROP COLUMN "is_approved";--> statement-breakpoint
ALTER TABLE "lesson_notes" DROP COLUMN "scheme_topic_id";