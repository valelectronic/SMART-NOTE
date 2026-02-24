CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium', 'school');--> statement-breakpoint
CREATE TABLE "ai_usage_analytics" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"onboarding_id" varchar(36),
	"action" varchar(30) NOT NULL,
	"topic_title" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"estimated_cost_usd" numeric(12, 8),
	"ai_provider" varchar(50),
	"ai_model" varchar(50),
	"was_cache_hit" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_history" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lesson_note_id" varchar(36),
	"export_type" varchar(20) NOT NULL,
	"exported_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "paystack_customer_id" varchar(100);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "paystack_subscription_code" varchar(100);--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "premium_trial_used" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "onboarding" ADD COLUMN "premium_trial_used_at" timestamp;--> statement-breakpoint
ALTER TABLE "ai_usage_analytics" ADD CONSTRAINT "ai_usage_analytics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_analytics" ADD CONSTRAINT "ai_usage_analytics_onboarding_id_onboarding_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_lesson_note_id_lesson_notes_id_fk" FOREIGN KEY ("lesson_note_id") REFERENCES "public"."lesson_notes"("id") ON DELETE no action ON UPDATE no action;