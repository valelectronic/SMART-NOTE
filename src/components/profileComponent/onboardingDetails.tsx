"use client";

import { useState, useTransition, FormEvent, } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Pencil,
  CheckCircle2,
  Loader2,
  FileText,
  ClipboardList,
  School
} from "lucide-react";
import { toast } from "sonner";
import { updateOnboardingAction } from "@/controllers/settings.controller";

// Defined in your controller: teachingLevelEnum
const TEACHING_LEVELS = ["basic_1_6", "jss_1_3", "sss_1_3"] as const;
type TeachingLevel = typeof TEACHING_LEVELS[number];
const SCHOOL_TYPES = ["government", "private", "mission", "international"] as const;
type SchoolType = typeof SCHOOL_TYPES[number];

// Defined in your controller: curriculumStandardEnum
const CURRICULUM_STANDARDS = ["national", "waec", "neco", "state"] as const;
type CurriculumStandard = typeof CURRICULUM_STANDARDS[number];

// Defined in your controller: preferredNoteFormatEnum
const NOTE_FORMATS = ["structured_table", "paragraph_style", "detailed_breakdown"] as const;
type NoteFormat = typeof NOTE_FORMATS[number];

type OnboardingProps = {
  profile: {
    subjectTaught?: string;
    teachingLevel?: "basic_1_6" | "jss_1_3" | "sss_1_3";
    curriculumStandard?: "national" | "waec" | "neco" | "state";
    preferredNoteFormat?: "structured_table" | "paragraph_style" | "detailed_breakdown";
    schoolType?: "government" | "private" | "mission" | "international";
  };
};

export default function OnboardingDetailsCard({ profile = {} as OnboardingProps["profile"] }) {
  const [open, setOpen] = useState(false);
  const [subjectTaught, setSubjectTaught] = useState(profile.subjectTaught || "");
  const [teachingLevel, setTeachingLevel] = useState(profile.teachingLevel || "");
  const [curriculumStandard, setCurriculumStandard] = useState(profile.curriculumStandard || "");
  const [preferredNoteFormat, setPreferredNoteFormat] = useState(profile.preferredNoteFormat || "");
  const [schoolType, setSchoolType] = useState(profile.schoolType || "");
  const [isPending, startTransition] = useTransition();

  // Enhanced formatter with better labels
  const formatDisplay = (value: string) => {
    if (!value) return "Not set";
    
    const formatMap: { [key: string]: string } = {
      'basic_1_6': 'Basic (Primary 1-6)',
      'jss_1_3': 'JSS (JSS 1-3)',
      'sss_1_3': 'SSS (SSS 1-3)',
      'government': 'Government (Public)',
      'private': 'Private',
      'mission': 'Mission/Faith-Based',
      'international': 'International',
      'national': 'National (NERDC)',
      'waec': 'WAEC',
      'neco': 'NECO',
      'state': 'State-Specific',
      'structured_table': 'Structured Table',
      'paragraph_style': 'Paragraph Style',
      'detailed_breakdown': 'Detailed Breakdown'
    };
    
    return formatMap[value] || value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!subjectTaught.trim() || !teachingLevel || !curriculumStandard || !preferredNoteFormat || !schoolType) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("subjectTaught", subjectTaught.trim());
        form.append("teachingLevel", teachingLevel);
        form.append("curriculumStandard", curriculumStandard);
        form.append("preferredNoteFormat", preferredNoteFormat);
        form.append("schoolType", schoolType);

        await updateOnboardingAction(form);
        toast.success("Teaching preferences updated successfully! 🎉");
        setOpen(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update details");
      }
    });
  }

  const handleCancel = () => {
    setSubjectTaught(profile.subjectTaught || "");
    setTeachingLevel(profile.teachingLevel || "");
    setCurriculumStandard(profile.curriculumStandard || "");
    setPreferredNoteFormat(profile.preferredNoteFormat || "");
    setSchoolType(profile.schoolType || "");
    setOpen(false);
  };

  const isFormValid = subjectTaught.trim() && teachingLevel.trim() && curriculumStandard.trim() && preferredNoteFormat.trim() && schoolType.trim();
  const isProfileComplete = subjectTaught && teachingLevel && curriculumStandard && preferredNoteFormat && schoolType;

  return (
    <Card className="w-full rounded-xl border border-border/40 bg-background shadow-sm">
      {/* Card Header */}
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Teaching Preferences
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your professional setup and content preferences
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

            {/* Enhanced Dialog Content */}
            <DialogContent className="w-[95vw] max-w-md rounded-xl max-h-[90vh] overflow-y-auto sm:max-w-lg sm:max-h-[80vh]">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-primary" />
                  Edit Teaching Preferences
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Update your teaching level, subjects, and content preferences
                </p>
              </DialogHeader>

              <form onSubmit={handleSave} className="space-y-5 px-1 pb-1">
                
                {/* Subject Taught */}
                <div className="space-y-3">
                  <Label htmlFor="subjectTaught" className="text-sm font-medium">
                    Subject Taught *
                  </Label>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      id="subjectTaught"
                      placeholder="e.g., Mathematics, English Language, Physics"
                      value={subjectTaught}
                      onChange={(e) => setSubjectTaught(e.target.value)}
                      className="flex-1 min-w-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the main subject you teach
                  </p>
                </div>

                {/* Teaching Level and School Type */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Teaching Level */}
                  <div className="space-y-3">
                    <Label htmlFor="teachingLevel" className="text-sm font-medium">
                      Teaching Level *
                    </Label>
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select
                        value={teachingLevel}
                        onValueChange={(value: TeachingLevel) => setTeachingLevel(value)}
                      >
                        <SelectTrigger id="teachingLevel" className="flex-1 min-w-0">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEACHING_LEVELS.map(level => (
                            <SelectItem key={level} value={level} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{formatDisplay(level).split(' (')[0]}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDisplay(level).split(' (')[1]?.replace(')', '')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* School Type */}
                  <div className="space-y-3">
                    <Label htmlFor="schoolType" className="text-sm font-medium">
                      School Type *
                    </Label>
                    <div className="flex items-center gap-3">
                      <School className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select
                        value={schoolType}
                        onValueChange={(value: SchoolType) => setSchoolType(value)}
                      >
                        <SelectTrigger id="schoolType" className="flex-1 min-w-0">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_TYPES.map(type => (
                            <SelectItem key={type} value={type} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{formatDisplay(type).split(' (')[0]}</span>
                                {formatDisplay(type).includes('(') && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDisplay(type).split(' (')[1]?.replace(')', '')}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Curriculum Standard and Note Format */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Curriculum Standard */}
                  <div className="space-y-3">
                    <Label htmlFor="curriculumStandard" className="text-sm font-medium">
                      Curriculum Standard *
                    </Label>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select
                        value={curriculumStandard}
                        onValueChange={(value: CurriculumStandard) => setCurriculumStandard(value)}
                      >
                        <SelectTrigger id="curriculumStandard" className="flex-1 min-w-0">
                          <SelectValue placeholder="Select standard" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRICULUM_STANDARDS.map(standard => (
                            <SelectItem key={standard} value={standard} className="py-3">
                              {formatDisplay(standard)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preferred Note Format */}
                  <div className="space-y-3">
                    <Label htmlFor="preferredNoteFormat" className="text-sm font-medium">
                      Note Format *
                    </Label>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select
                        value={preferredNoteFormat}
                        onValueChange={(value: NoteFormat) => setPreferredNoteFormat(value)}
                      >
                        <SelectTrigger id="preferredNoteFormat" className="flex-1 min-w-0">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTE_FORMATS.map(format => (
                            <SelectItem key={format} value={format} className="py-3">
                              {formatDisplay(format)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Enhanced Dialog Footer */}
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
                    disabled={isPending || !isFormValid}
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

      {/* Enhanced Card Content */}
      <CardContent className="px-4 py-4 space-y-5 sm:px-6 sm:py-5">
        
        {/* Status Indicator */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
            isProfileComplete 
              ? 'border-green-200 bg-transparent' 
              : 'border-amber-200 bg-transparent'
          }`}>
            <div className={`h-3 w-3 rounded-full ${
              isProfileComplete ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {isProfileComplete ? 'Preferences Complete' : 'Preferences Incomplete'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isProfileComplete 
                  ? 'All teaching preferences are set' 
                  : 'Please complete your teaching preferences'
                }
              </p>
            </div>
          </div>

        {/* Information Grid */}
        <div className="grid gap-4">
          {/* First Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem 
              Icon={BookOpen} 
              label="Subject Taught" 
              value={subjectTaught} 
            />
            <DetailItem
              Icon={Briefcase} 
              label="Teaching Level" 
              value={formatDisplay(teachingLevel)} 
            />
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem 
              Icon={School} 
              label="School Type" 
              value={formatDisplay(schoolType)} 
            />
            <DetailItem 
              Icon={GraduationCap} 
              label="Curriculum" 
              value={formatDisplay(curriculumStandard)} 
            />
          </div>

          {/* Third Row - Full width on mobile, half on desktop */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem 
              Icon={FileText} 
              label="Note Format" 
              value={formatDisplay(preferredNoteFormat)} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced DetailItem Component
const DetailItem = ({ Icon, label, value }: { Icon: React.ElementType, label: string, value: string }) => (
  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {label}
      </p>
      <p className={`text-sm font-medium truncate ${!value || value === 'Not set' ? 'text-muted-foreground italic' : 'text-foreground'}`}>
        {value || "Not set"}
      </p>
    </div>
  </div>
);