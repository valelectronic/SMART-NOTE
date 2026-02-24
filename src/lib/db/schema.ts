
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgEnum, varchar,  integer , decimal} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});


// onboarding enums
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);
export const schoolTypeEnum = pgEnum("school_type", [
  "government",
  "private",
  "mission",
  "international",
]);
export const curriculumStandardEnum = pgEnum("curriculum_standard", [
  "national",
  "waec",
  "neco",
  "state",
]);
export const preferredNoteFormatEnum = pgEnum("preferred_note_format", [
  "structured_table",
  "paragraph_style",
  "detailed_breakdown",
]);
// Add completion status enum
export const completionStatusEnum = pgEnum("completion_status", [
  "incomplete",
  "complete",
  "pending_review"
]);

export const teachingLevelEnum = pgEnum("teaching_level", [
  "basic_1_6",
  "jss_1_3",
  "sss_1_3",
]);

export const sowProcessingStatusEnum = pgEnum("sow_processing_status", [
    "pending",
    "processing",
    "complete",
    "failed",
    "idle"
]);

// ✅ NEW: Subscription Tiers
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
  "school" // For bulk institutional access
]);

// onboarding table
export const onboarding = pgTable("onboarding", {

  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),

    fullName: varchar("full_name", { length: 255 }).notNull(),

  // School Info
  schoolName: varchar("school_name", { length: 150 }).notNull(),
  schoolType: schoolTypeEnum("school_type").notNull(),
  schoolState: varchar("school_state", { length: 100 }).notNull(),
  localGovt: varchar("local_govt", { length: 100 }).notNull(),

  //Teaching Details
  subjectTaught: text("subject_taught").notNull(),
  teachingLevel: teachingLevelEnum("teaching_level").notNull(),
  curriculumStandard: curriculumStandardEnum("curriculum_standard").notNull(),
  preferredNoteFormat: preferredNoteFormatEnum("preferred_note_format").notNull(),



  //  SOW METADATA (Permanent Record for Frontend)
  sowTitle: varchar("sow_title", { length: 255 }), 
  sowUploadedAt: timestamp("sow_uploaded_at"), 
  sowFileKey: text("sow_file_key"),
//  NEW FIELDS FOR ASYNCHRONOUS JOB TRACKING 
  sowProcessingStatus: sowProcessingStatusEnum("sow_processing_status").default("complete"),
  sowErrorMessage: text("sow_error_message"),

//  RAW EXTRACTED TEXT (CRITICAL FOR AI + PARSING)
      sowExtractedText: text("sow_extracted_text"),
       sowEdited: boolean("sow_edited").default(false),

       // ✅ PAYSTACK & SUBSCRIPTION FIELDS
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  paystackCustomerId: varchar("paystack_customer_id", { length: 100 }),
  paystackSubscriptionCode: varchar("paystack_subscription_code", { length: 100 }),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  lastPaymentDate: timestamp("last_payment_date").defaultNow(),


  // ✅ TRIAL TRACKING
  premiumTrialUsed: boolean("premium_trial_used").default(false),
  premiumTrialUsedAt: timestamp("premium_trial_used_at"),
  // Add this to your onboarding table in schema.ts
  //  Settings
  approvalStatus: approvalStatusEnum("approval_status").notNull().default("pending"),
  profileCompleted:  boolean("profile_completed").default(false),
  lastGeneratedAt: timestamp("last_generated_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// ✅ NEW: AI Usage & Financial Analytics
export const aiUsageAnalytics = pgTable("ai_usage_analytics", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  onboardingId: varchar("onboarding_id", { length: 36 }).references(() => onboarding.id),

  action: varchar("action", { length: 30 }).notNull(), // "generation", "refinement", "regeneration"
  topicTitle: text("topic_title"),

  // Cost Tracking (scale 8 to catch tiny token costs)
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  estimatedCostUsd: decimal("estimated_cost_usd", { precision: 12, scale: 8 }), 
  
  aiProvider: varchar("ai_provider", { length: 50 }), // "anthropic", "groq"
  aiModel: varchar("ai_model", { length: 50 }),
  
  wasCacheHit: boolean("was_cache_hit").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ✅ NEW: Export & Print History (To limit free users)
export const exportHistory = pgTable("export_history", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lessonNoteId: varchar("lesson_note_id", { length: 36 }).references(() => lessonNotes.id),
  
  exportType: varchar("export_type", { length: 20 }).notNull(), // "pdf", "print", "word"
  exportedAt: timestamp("exported_at").defaultNow().notNull(),
});

//  Scheme Topics Table
// New table for the Weekly unit
export const schemeWeeks = pgTable("scheme_weeks", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .default(sql`gen_random_uuid()`),

    onboardingId: varchar("onboarding_id", { length: 36 })
        .notNull()
        .references(() => onboarding.id, { onDelete: "cascade" }),

    weekNumber: integer("week_number").notNull(), // e.g., Week 1, Week 2
    term: varchar("term", { length: 20 }), // e.g., First Term, Second Term
    
    // Status tracking for the whole week
    reviewed: boolean("reviewed").default(false), 
    approved: boolean("approved").default(false), 

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

// Updated for flexibility with optional content
// Updated Schema: Performance Objectives Removed
export const schemeSubTopics = pgTable("scheme_sub_topics", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .default(sql`gen_random_uuid()`),

    schemeWeekId: varchar("scheme_week_id", { length: 36 })
        .notNull()
        .references(() => schemeWeeks.id, { onDelete: "cascade" }),

    topicTitle: text("topic_title").notNull(), 
    
    // This holds the "Meaning, types, importance..." text from your AI
    topicContent: text("topic_content"), 
    
    extractedFrom: text("extracted_from"), 

    notesGenerated: boolean("notes_generated").default(false), 

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});


// language table 
export const languages = pgTable("languages", {
    id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nativeName: varchar("native_name", { length: 100 }),
});

// profile setting 

export const ProfileSettings = pgTable("profile_settings", {
    id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }).unique(),

  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  languageId: varchar("language_id", { length: 36 })
    .references(() => languages.id),

  bio: text("bio"),
    displayName: varchar("display_name", { length: 100 }),
  socialLinks: text("social_links"), 


  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// lesson notes table
export const lessonNotes = pgTable("lesson_notes", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  onboardingId: varchar("onboarding_id", { length: 36 })
    .references(() => onboarding.id, { onDelete: "set null" }),

  schemeSubTopicId: varchar("scheme_sub_topic_id", { length: 36 })
    .references(() => schemeSubTopics.id, { onDelete: "set null" }),

  // --- CORE CONTENT ---
  title: varchar("title", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: text("topic").notNull(),
  gradeLevel: varchar("grade_level", { length: 50 }).notNull(),
  curriculum: curriculumStandardEnum("curriculum").notNull(),
  content: text("content").notNull(), // The latest version of the note
  
  // --- VERSIONING & CORRECTIONS (The "Premium" additions) ---
  // To keep track of the original note before corrections
  originalContent: text("original_content"), 
  
  // Rule: Max 2 corrections
  editCount: integer("edit_count").default(0).notNull(), 
  regenCount: integer("regen_count").default(0).notNull(),
  
  // The teacher's specific instruction for the last correction
  lastCorrectionInstruction: text("last_correction_instruction"),

  // --- LIMITS & COOLDOWNS ---
  // To enforce the 5-minute cooldown between edits
  lastGeneratedAt: timestamp("last_generated_at").defaultNow(),
  
  // --- AI METADATA ---
  promptUsed: text("prompt_used"), // The full contextual prompt
  aiModelUsed: varchar("ai_model_used", { length: 50 }),
  providerUsed: varchar("provider_used", { length: 20 }),
  generationTime: integer("generation_time"), 
  wordCount: integer("word_count"),

  // --- STATUS ---
  formatUsed: preferredNoteFormatEnum("format_used").notNull(),
  completionStatus: completionStatusEnum("completion_status").default("incomplete"),
  isDraft: boolean("is_draft").default(true),
  isPublic: boolean("is_public").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});


/* ---------- Relations ---------- */
export const onboardingRelations = relations(onboarding, ({ one, many }) => ({
  user: one(user, { fields: [onboarding.userId],
     references: [user.id] }),
  lessonNotes: many(lessonNotes),
  schemeWeeks: many(schemeWeeks),
  analytics : many(aiUsageAnalytics),
}));



export const userRelations = relations(user, ({ many }) => ({
  onboarding: many(onboarding),
  profileSettings: many(ProfileSettings),
  lessonNotes: many(lessonNotes),
  analytics: many(aiUsageAnalytics),
   
}));

export const aiUsageAnalyticsRelations = relations(aiUsageAnalytics, ({ one }) => ({
  user: one(user, { fields: [aiUsageAnalytics.userId], references: [user.id] }),
  onboarding: one(onboarding, { fields: [aiUsageAnalytics.onboardingId], references: [onboarding.id] }),
}));

export const exportHistoryRelations = relations(exportHistory, ({ one }) => ({
  user: one(user, { fields: [exportHistory.userId], references: [user.id] }),
  lessonNote: one(lessonNotes, { fields: [exportHistory.lessonNoteId], references: [lessonNotes.id] }),
}));

export const schemeWeeksRelations = relations(schemeWeeks, ({ one, many }) => ({
    onboarding: one(onboarding, {
        fields: [schemeWeeks.onboardingId],
        references: [onboarding.id]
    }),
    subTopics: many(schemeSubTopics), // A week contains many sub-topics
}));

// NEW: Define relations for the new schemeSubTopics table (the new source for notes)
export const schemeSubTopicsRelations = relations(schemeSubTopics, ({ one, many }) => ({
    schemeWeek: one(schemeWeeks, {
        fields: [schemeSubTopics.schemeWeekId],
        references: [schemeWeeks.id]
    }),
    lessonNotes: many(lessonNotes), // A sub-topic can have many notes (drafts/versions)
}));

export const lessonNotesRelations = relations(lessonNotes, ({ one }) => ({
  user: one(user, { fields: [lessonNotes.userId], 
    references: [user.id] }),

 onboarding: one(onboarding,
        { 
            fields: [lessonNotes.onboardingId],
            references: [onboarding.id] 
        }),

  schemeSubTopic: one(schemeSubTopics,
        {
            fields: [lessonNotes.schemeSubTopicId],
            references: [schemeSubTopics.id]
        }),
      
}));

export const profileSettingsRelations = relations(ProfileSettings, ({ one }) => ({
  user: one(user, 
    { fields: [ProfileSettings.userId], 
      references: [user.id] }),
  language: one(languages,
     { fields: [ProfileSettings.languageId], 
      references: [languages.id] }),
}));




