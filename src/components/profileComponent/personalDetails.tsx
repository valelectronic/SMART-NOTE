// src/components/profile/PersonalInfoCard.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOnboardingAction, updateProfileSettingsController } from "@/controllers/settings.controller";
import { User, Mail, MapPin, Building, FileText, Pencil, CheckCircle2, Loader2, School } from "lucide-react";
import { useState, FormEvent, useTransition } from "react";
import { toast } from "sonner";

type ProfileProps = {
  profile:{
    fullName? : string;
    email? : string;
    schoolState? : string;
    localGovt? : string;
    bio? : string | null;
    schoolName? : string;
  } 
}

export default function PersonalInfoCard({profile}: ProfileProps) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [schoolState, setSchoolState] = useState(profile?.schoolState || "");
  const [localGovt, setLocalGovt] = useState(profile?.localGovt || "");
  const [schoolName, setSchoolName] = useState(profile?.schoolName || "");
  const [isPending, startTransition] = useTransition();

  function handleSave(e: FormEvent) {
    e.preventDefault();

    // Validation
    if (!schoolState.trim()) {
      toast.error("Please enter your school state");
      return;
    }

    if (!localGovt.trim()) {
      toast.error("Please enter your local government");
      return;
    }

    if (!schoolName.trim()) {
      toast.error("Please enter your school name");
      return;
    }

    startTransition(async () => {
      try {
        // ✅ Update onboarding info
        const form1 = new FormData();
        form1.append("schoolState", schoolState.trim());
        form1.append("localGovt", localGovt.trim());
        form1.append("schoolName", schoolName.trim());
        await updateOnboardingAction(form1);

        // ✅ Update profile info (bio)
        const form2 = new FormData();
        form2.append("bio", bio.trim());
        await updateProfileSettingsController(form2);

        toast.success("Profile updated successfully! 🎉");
        setOpen(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile");
      }
    });
  }

  const handleCancel = () => {
    // Reset form state when canceling
    setBio(profile?.bio || "");
    setSchoolState(profile?.schoolState || "");
    setLocalGovt(profile?.localGovt || "");
    setSchoolName(profile?.schoolName || "");
    setOpen(false);
  };

  return (
    <Card className="w-full rounded-xl border border-border/40 bg-background shadow-sm">
      {/* Card Header */}
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your profile details and location information
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="shrink-0 h-9 px-3 gap-1.5 border-primary/20 hover:border-primary/40"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Edit</span>
              </Button>
            </DialogTrigger>

            {/* Mobile-Optimized Dialog */}
            <DialogContent className="w-[95vw] max-w-md rounded-xl max-h-[90vh] overflow-y-auto sm:max-w-lg sm:max-h-[80vh]">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-primary" />
                  Edit Personal Information
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Update your location details and bio
                </p>
              </DialogHeader>

              <form onSubmit={handleSave} className="space-y-5 px-1 pb-1">
                {/* School Name */}
                <div className="space-y-3">
                  <Label htmlFor="schoolName" className="text-sm font-medium">
                    School Name *
                  </Label>
                  <div className="flex items-center gap-3">
                    <School className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      id="schoolName"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Enter your school name"
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>

                {/* School State */}
                <div className="space-y-3">
                  <Label htmlFor="schoolState" className="text-sm font-medium">
                    School State *
                  </Label>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      id="schoolState"
                      value={schoolState}
                      onChange={(e) => setSchoolState(e.target.value)}
                      placeholder="Enter your state of deployment"
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>

                {/* Local Government */}
                <div className="space-y-3">
                  <Label htmlFor="localGovt" className="text-sm font-medium">
                    Local Government *
                  </Label>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      id="localGovt"
                      value={localGovt}
                      onChange={(e) => setLocalGovt(e.target.value)}
                      placeholder="Enter your local government"
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-3">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    Bio
                  </Label>
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us something about yourself, your teaching experience, or your educational philosophy..."
                        className="resize-none min-w-0 text-sm"
                        rows={4}
                        maxLength={300}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Optional • {bio.length}/300 characters
                        </p>
                        {bio.length > 250 && (
                          <p className="text-xs text-amber-600 font-medium">
                            {300 - bio.length} left
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Read-only fields for context */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Account Information (Read-only)
                  </Label>
                  <div className="grid gap-3 mt-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.fullName || "No name"}
                        </p>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.email || "No email"}
                        </p>
                        <p className="text-xs text-muted-foreground">Email Address</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile-Optimized Footer */}
                <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="w-full sm:w-24 order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending || !schoolState.trim() || !localGovt.trim() || !schoolName.trim()}
                    className="w-full sm:w-32 gap-2 order-1 sm:order-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="px-4 py-4 space-y-5 sm:px-6 sm:py-5">
        {/* Status Indicator */}
    {/* Status Indicator with Light Green Background */}
{/* Status Indicator - Border Only */}
<div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
  profile?.schoolState && profile?.localGovt && profile?.schoolName 
    ? 'border-green-200 bg-transparent' 
    : 'border-amber-200 bg-transparent'
}`}>
  <div className={`h-3 w-3 rounded-full ${
    profile?.schoolState && profile?.localGovt && profile?.schoolName 
      ? 'bg-green-500' 
      : 'bg-amber-500'
  }`} />
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium">
      {profile?.schoolState && profile?.localGovt && profile?.schoolName 
        ? 'Profile complete' 
        : 'Profile incomplete'}
    </p>
    <p className="text-xs text-muted-foreground">
      {profile?.schoolState && profile?.localGovt && profile?.schoolName 
        ? 'All location details are set' 
        : 'Please complete your location details'}
    </p>
  </div>
</div>

        {/* Information Grid */}
        <div className="grid gap-4">
          {/* Personal Info Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
              <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Full Name
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.fullName || "Not set"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Email Address
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.email || "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Location Info Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
              <School className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  School Name
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.schoolName || "Not set"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  School State
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.schoolState || "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Single Column Items */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
              <Building className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Local Government
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.localGovt || "Not set"}
                </p>
              </div>
            </div>

            {/* Bio - Full width */}
            <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
              <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Bio
                </p>
                <p className={`text-sm text-foreground ${!profile?.bio ? 'text-muted-foreground italic' : ''}`}>
                  {profile?.bio || "No bio added yet. Tell us about yourself..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}