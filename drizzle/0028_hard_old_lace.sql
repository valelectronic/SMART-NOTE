CREATE TYPE "public"."assessment_format" AS ENUM('Objectives', 'Theory', 'Mixed');--> statement-breakpoint
CREATE TYPE "public"."assessment_type" AS ENUM('Exam', 'Test', 'Assignment');--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"onboarding_id" varchar(36),
	"type" "assessment_type" NOT NULL,
	"format" "assessment_format" NOT NULL,
	"subject" varchar(100) NOT NULL,
	"class_level" varchar(50) NOT NULL,
	"term" varchar(50),
	"duration" varchar(50),
	"obj_count" integer DEFAULT 0 NOT NULL,
	"theory_count" integer DEFAULT 0 NOT NULL,
	"source_note_ids" text NOT NULL,
	"content" text NOT NULL,
	"ai_model_used" varchar(50),
	"provider_used" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE set null ON UPDATE no action;