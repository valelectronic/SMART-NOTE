"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboarding, ProfileSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { InferInsertModel } from "drizzle-orm";
import {
  ProfileSettingsSchema,
  OnboardingSchema,
  field,
  cleanObject,
} from "@/lib/db/validation/profileSchema";

// ✅ Get profile data
export async function getProfileController(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("You must be logged in");

  try {
    const onboardingData = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
    });


    const settings = await db.query.ProfileSettings.findFirst({
      where: eq(ProfileSettings.userId, userId),
      with: { language: true },
    });

    if (!onboardingData) return null;

    return {
      ...onboardingData,
      bio: settings?.bio ?? null,
      fileUrl: settings?.fileUrl ?? null,
      thumbnailUrl: settings?.thumbnailUrl ?? null,
      language: settings?.language ?? null,
      fullName: session?.user?.name ?? "Anonymous",
      email: session?.user?.email ?? null,
      displayName: settings?.displayName ?? null,
      socialLinks: settings?.socialLinks ?? null,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ✅ Update profile settings
export async function updateProfileSettingsController(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("You must be logged in");

  try {
    const data = ProfileSettingsSchema.parse({
      fileUrl: field(formData, "fileUrl"),
      thumbnailUrl: field(formData, "thumbnailUrl"),
      bio: field(formData, "bio"),
      languageId: field(formData, "languageId"),
      displayName: field(formData, "displayName"),
      socialLinks: field(formData, "socialLinks"),
    });

    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v != null && v !== "")) as Partial<InferInsertModel<typeof ProfileSettings>>;

    if (Object.keys(cleanData).length === 0)
      return { success: false, error: "No data provided to update" };

    const [record] = await db
      .insert(ProfileSettings)
      .values({ userId: session.user.id, ...cleanData })
      .onConflictDoUpdate({
        target: ProfileSettings.userId,
        set: { ...cleanData, updatedAt: new Date() },
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/profile-settings");
    revalidatePath("/community/profile");
    revalidatePath("/news-feed");

    return { success: true, data: record };
  } catch (err) {
    console.error("Profile update failed:", err);
    return { success: false, error: "Failed to update profile settings" };
  }
}

// ✅ Update onboarding
export async function updateOnboardingAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return { success: false, message: "You must be logged in to update your onboarding." };

  const userId = session.user.id;

  try {
    const rawData = {
      fullName: field(formData, "fullName"),
      schoolName: field(formData, "schoolName"),
      schoolType: field(formData, "schoolType"),
      schoolState: field(formData, "schoolState"),
      localGovt: field(formData, "localGovt"),
      subjectTaught: field(formData, "subjectTaught"),
      teachingLevel: field(formData, "teachingLevel"),
      curriculumStandard: field(formData, "curriculumStandard"),
      preferredNoteFormat: field(formData, "preferredNoteFormat"),
    };
    const validatedPartialData = OnboardingSchema.partial().parse(rawData);
    const updatePayload = cleanObject({ ...validatedPartialData, updatedAt: new Date() });
    

    if (Object.keys(updatePayload).length === 0)
      return { success: false, message: "No valid data provided for update." };
    // 2. Determine if a record exists.
        const existingRecord = await db.query.onboarding.findFirst({
            where: eq(onboarding.userId, userId),
            columns: { userId: true, fullName: true, schoolName: true, schoolState: true, localGovt: true }
        });

        if (existingRecord) {

          await db
                .update(onboarding)
                .set(updatePayload)
                .where(eq(onboarding.userId, userId));
        }else {
          return { success: false, message: " Please complete the full profile form first." };
        }


    revalidatePath("/dashboard/profile");
    revalidatePath("/profile-settings");
    revalidatePath("/");

    return { success: true, message: "Onboarding updated successfully!" };
  } catch (error) {
    console.error("Onboarding update failed:", error);
    return { success: false, message: "Failed to update onboarding" };
  }
}
