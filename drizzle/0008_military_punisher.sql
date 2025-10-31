CREATE TYPE "public"."completion_status" AS ENUM('incomplete', 'complete', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."curriculum_standard" AS ENUM('national', 'waec', 'neco', 'state');--> statement-breakpoint
CREATE TYPE "public"."preferred_note_format" AS ENUM('structured_table', 'paragraph_style', 'detailed_breakdown');--> statement-breakpoint
CREATE TYPE "public"."school_type" AS ENUM('government', 'private', 'mission', 'international');--> statement-breakpoint
CREATE TYPE "public"."teaching_level" AS ENUM('basic_1_6', 'jss_1_3', 'sss_1_3');--> statement-breakpoint
CREATE TABLE "lesson_notes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"scheme_topic_id" varchar(36),
	"title" varchar(200) NOT NULL,
	"subject" varchar(100) NOT NULL,
	"topic" text NOT NULL,
	"grade_level" varchar(50) NOT NULL,
	"curriculum" "curriculum_standard" NOT NULL,
	"content" text NOT NULL,
	"visual_aids" text,
	"format_used" "preferred_note_format" NOT NULL,
	"review_notes" text,
	"word_count" integer,
	"download_url" text,
	"term" varchar(20),
	"session_year" varchar(10),
	"generation_time" integer,
	"ai_model_used" varchar(50),
	"prompt_version" varchar(20),
	"is_draft" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_topics" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onboarding_id" varchar(36) NOT NULL,
	"week_number" integer NOT NULL,
	"topic" text NOT NULL,
	"sub_topics" text,
	"extracted_from" text,
	"reviewed" boolean DEFAULT false,
	"approved" boolean DEFAULT false,
	"notes_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_days" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "onboarding_days" CASCADE;--> statement-breakpoint
ALTER TABLE "profile_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "languages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "onboarding" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "profile_settings" ADD COLUMN "display_name" varchar(100);--> statement-breakpoint
ALTER TABLE "profile_settings" ADD COLUMN "social_links" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "school_name" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "school_type" "school_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "school_state" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "subject_taught" text NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "teaching_level" "teaching_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "curriculum_standard" "curriculum_standard" NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "preferred_note_format" "preferred_note_format" NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "term" varchar(20);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "session_year" varchar(10);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "scheme_of_work_url" text;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "scheme_extracted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "approval_status" "approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "profile_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "last_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_scheme_topic_id_scheme_topics_id_fk" FOREIGN KEY ("scheme_topic_id") REFERENCES "public"."scheme_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_topics" ADD CONSTRAINT "scheme_topics_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_settings" DROP COLUMN "class_link";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "nysc_state";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "teach_skill";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "learn_skill";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "experience";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "teaching_model";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "from_time";--> statement-breakpoint
ALTER TABLE "onboarding" DROP COLUMN "to_time";--> statement-breakpoint
DROP TYPE "public"."experience";--> statement-breakpoint
DROP TYPE "public"."teaching_model";