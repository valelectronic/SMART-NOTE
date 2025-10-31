import { z } from "zod";
import {
  curriculumStandardEnum,
  teachingLevelEnum,
  preferredNoteFormatEnum,
  schoolTypeEnum,
} from "@/lib/db/schema";

// ✅ Profile Settings Schema
export const ProfileSettingsSchema = z.object({
  fileUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  bio: z.string().max(300, "Bio must be 300 characters or less").nullable().optional(),
  languageId: z.string().uuid().nullable().optional(),
  displayName: z.string().max(100, "Display name must be 100 characters or less").nullable().optional(),
  socialLinks: z.string().nullable().optional(),
});

// ✅ Onboarding Schema
export const OnboardingSchema = z.object({
  fullName: z.string().min(3, "Full Name is required.").max(255),
  schoolName: z.string().min(3, "School name is required.").max(150),
  schoolType: z.enum(schoolTypeEnum.enumValues, { message: "Invalid school type." }),
  schoolState: z.string().min(2, "State is required.").max(100),
  localGovt: z.string().min(2, "Local Govt is required.").max(100),
  subjectTaught: z.string().min(2, "Subject is required."),
  teachingLevel: z.enum(teachingLevelEnum.enumValues, { message: "Invalid teaching level." }),
  curriculumStandard: z.enum(curriculumStandardEnum.enumValues, { message: "Invalid curriculum standard." }),
  preferredNoteFormat: z.enum(preferredNoteFormatEnum.enumValues, { message: "Invalid note format." }),
});


//  Helper function
export const field = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return v === null || v === "" ? undefined : (v as string);
};


//  Replaced 'any' with the safer 'unknown' type.
export const cleanObject = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
};