CREATE TYPE "public"."experience" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."teaching_model" AS ENUM('online', 'offline');--> statement-breakpoint
CREATE TABLE "onboarding" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"nysc_state" varchar(100) NOT NULL,
	"local_govt" varchar(100) NOT NULL,
	"teach_skill" text NOT NULL,
	"learn_skill" text NOT NULL,
	"experience" "experience" NOT NULL,
	"teaching_model" "teaching_model" DEFAULT 'online' NOT NULL,
	"from_time" time NOT NULL,
	"to_time" time NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_days" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"onboarding_id" varchar(36) NOT NULL,
	"day" varchar(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_days" ADD CONSTRAINT "onboarding_days_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE cascade ON UPDATE no action;