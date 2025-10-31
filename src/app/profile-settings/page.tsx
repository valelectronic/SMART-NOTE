

import OnboardingDetailsCard from "@/components/profileComponent/onboardingDetails";
import PersonalInfoCard from "@/components/profileComponent/personalDetails";
import ProfileCard from "@/components/profileComponent/profileDetails";
import ScrollArrow from "@/components/scrollArrow";
import { getProfileController } from "@/controllers/settings.controller";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";



export default async function ProfileSettings() {


  const session = await auth.api.getSession({ 
    headers: await headers() });
  if (!session?.user) throw new Error('You must be logged in');

  

  const profile = await getProfileController(session.user.id)

  if (!profile) throw new Error("Profile not found"); // ✅ runtime safeguard

  const onboardingDetails = {
        subjectTaught: profile.subjectTaught,
        teachingLevel: profile.teachingLevel,
        curriculumStandard: profile.curriculumStandard,
        preferredNoteFormat: profile.preferredNoteFormat,
        schoolType: profile.schoolType,
    };

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile & Settings</h1>
        <ProfileCard profile = {profile}/>
        <PersonalInfoCard profile = {profile} />
        <OnboardingDetailsCard profile = {onboardingDetails} />
      </div>
    </div>
    <ScrollArrow/>
    </>
  );
}