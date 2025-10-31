// src/controllers/onboarding.controller.ts
"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { onboarding } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import z from "zod"

// -------- VALIDATION SCHEMA (FIXED ZOD ENUM) --------
const OnboardingSchema = z.object({
    // Page 1 Fields (Identity)
    fullName: z.string().min(1, "Full Name is required"),
    schoolName: z.string().min(2, "School Name is required"),
    //  Using 'message' instead of 'required_error' for z.enum
    schoolType: z.enum(["government", "private", "mission", ], { 
        message: "School Type is required and must be one of the specified values." 
    }),

    // Page 2 Fields (Location & Levels)
    schoolState: z.string().min(2, "School State is required"),
    localGovt: z.string().min(2, "Local Govt is required"),
    teachingLevel: z.string().min(1, "At least one teaching level is required"), 

    // Page 3 Fields (Subjects & Preferences)
    subjectTaught: z.string().min(1, "At least one subject is required"),
    preferredNoteFormat: z.enum(["structured_table", "paragraph_style", "detailed_breakdown"], { 
        message: "Note format is required." 
    }),
    curriculumStandard: z.enum(["national", "waec", "neco", "state"], { 
        message: "Curriculum standard is required." 
    }),
})

export type OnboardingFormValues = z.infer<typeof OnboardingSchema>

// server action
export async function saveOnboardingAction(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session?.user) {
        return { success: false, message: "Unauthorized: You must be logged in." };
    }

    try {
        // 1. Prepare data for Zod parsing
        const rawData = {
            fullName: formData.get("fullName"),
            schoolName: formData.get("schoolName"),
            schoolType: formData.get("schoolType"),
            schoolState: formData.get("schoolState"),
            localGovt: formData.get("localGovt"),
            teachingLevel: formData.get("teachingLevel"), 
            subjectTaught: formData.get("subjectTaught"), 
            preferredNoteFormat: formData.get("preferredNoteFormat"),
            curriculumStandard: formData.get("curriculumStandard"),
        };

        // 2. Parse and validate
        const parsed = OnboardingSchema.parse(rawData);

        // 3. Check if onboarding already exists
        const existing = await db.query.onboarding.findFirst({
            where: eq(onboarding.userId, session.user.id),
        });

        let onboardingId: string;

        //  Using camelCase keys to match the Drizzle schema object property names
        const valuesToSave = {
            fullName: parsed.fullName,
            schoolName: parsed.schoolName,
            schoolType: parsed.schoolType,
            schoolState: parsed.schoolState,
            localGovt: parsed.localGovt,
            teachingLevel: parsed.teachingLevel,
            subjectTaught: parsed.subjectTaught,
            preferredNoteFormat: parsed.preferredNoteFormat,
            curriculumStandard: parsed.curriculumStandard,
            // Including these key fields, setting their initial state
            schemeOfWorkUrl: null, 
            schemeExtracted: false, 
        };

        if (existing) {
            // --- Update existing ---
            const updated = await db
                .update(onboarding)
                .set({
                    ...valuesToSave,
                    updatedAt: new Date(),
                })
                .where(eq(onboarding.id, existing.id))
                .returning({ id: onboarding.id });

            onboardingId = updated[0]?.id ?? existing.id;

        } else {
            // --- Insert new ---
            const inserted = await db
                .insert(onboarding)
                .values({
                    userId: session.user.id,
                    ...valuesToSave,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning({ id: onboarding.id });

            onboardingId = inserted[0].id;
        }

        // Revalidate page
        revalidatePath("/onboarding");

        return {
            success: true,
            message: "Profile saved successfully. Proceed to file upload.",
            onboardingId,
        };
    } catch (error) {
        console.error("Onboarding Server Action Error:", error);

        if (error instanceof z.ZodError) {
            // Return only the first validation error message
            return {
                success: false,
                message: "Validation failed: ",
            };
        }

        return {
            success: false,
            message: "Failed to save onboarding due to a server error.",
        };
    }
}