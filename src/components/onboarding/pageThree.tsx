// src/components/onboarding/PageThreePreferences.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Loader2, 
    X, 
    CheckCircle,
    Plus,
    AlertCircle,
    Settings
} from "lucide-react"; 
import { cn } from "@/lib/utils";

const MAX_SUBJECTS = 3;

const COMMON_SUBJECTS = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Economics", "History", "Civic Education"];

const NOTE_FORMAT_OPTIONS = [
    { value: "structured_table", label: "Structured Table (Simple)" },
    { value: "paragraph_style", label: "Paragraph Style (Essay)" },
    { value: "detailed_breakdown", label: "Detailed Breakdown (Comprehensive)" },
];

const CURRICULUM_OPTIONS = [
    { value: "national", label: "National (NERDC)" },
    { value: "waec", label: "WAEC" },
    { value: "neco", label: "NECO" },
    { value: "state", label: "State-Specific" },
];

export type PageThreeData = {
    subjectTaught: string[];
    preferredNoteFormat: "structured_table" | "paragraph_style" | "detailed_breakdown" | "";
    curriculumStandard: "national" | "waec" | "neco" | "state" | "";
};

interface PageThreePreferencesProps {
    data: PageThreeData;
    setData: (d: Partial<PageThreeData>) => void;
    onNext: () => void;
    onBack?: () => void;
    loading?: boolean;
}

export default function PageThreePreferences({ onNext, onBack, data, setData, loading = false }: PageThreePreferencesProps) {
    
    const [customSubjectInput, setCustomSubjectInput] = useState("");
    const [touched, setTouched] = useState({
        preferredNoteFormat: false,
        curriculumStandard: false
    });
    
    const isSubjectValid = data.subjectTaught.length > 0 && data.subjectTaught.length <= MAX_SUBJECTS;
    const isNoteFormatValid = !!data.preferredNoteFormat;
    const isCurriculumValid = !!data.curriculumStandard;
    
    const isValid = isSubjectValid && isNoteFormatValid && isCurriculumValid;

    const showError = (field: keyof typeof touched) => {
        return touched[field] && !data[field];
    };

    const toggleSubject = (subject: string) => {
        const isSelected = data.subjectTaught.includes(subject);
        const currentCount = data.subjectTaught.length;

        if (isSelected) {
            setData({
                subjectTaught: data.subjectTaught.filter(s => s !== subject)
            });
        } else if (currentCount < MAX_SUBJECTS) {
            setData({
                subjectTaught: [...data.subjectTaught, subject],
            });
        }
    };
    
    const handleAddCustomSubject = () => {
        const subject = customSubjectInput.trim();
        
        if (subject && 
            !data.subjectTaught.map(s => s.toLowerCase()).includes(subject.toLowerCase()) && 
            data.subjectTaught.length < MAX_SUBJECTS) {
            
            const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
            
            setData({
                subjectTaught: [...data.subjectTaught, capitalizedSubject],
            });
            setCustomSubjectInput("");
        }
    };

    const handleRemoveSubject = (subject: string) => {
        setData({
            subjectTaught: data.subjectTaught.filter(s => s !== subject)
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onNext();
        } else {
            setTouched({ preferredNoteFormat: true, curriculumStandard: true });
        }
    };

    return (
        <Card className="w-full border-0 shadow-none">
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Help Text */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-start gap-3">
                            <Settings className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    Teaching Preferences
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Customize your lesson note format and curriculum preferences.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Field 1: Subjects Taught */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">
                                Subjects You Teach
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                    {data.subjectTaught.length}/{MAX_SUBJECTS}
                                </span>
                                {isSubjectValid && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                        </div>
                        
                        {/* Selected Subjects */}
                        {data.subjectTaught.length > 0 ? (
                            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20 min-h-[52px]">
                                {data.subjectTaught.map((subject) => (
                                    <Badge 
                                        key={subject} 
                                        variant="secondary"
                                        className="text-sm py-1.5 px-3 flex items-center gap-1 group transition-colors"
                                    >
                                        <span>{subject}</span>
                                        <span
                                            role="button"
                                            aria-label={`Remove ${subject}`}
                                            className="h-full px-1 flex items-center justify-center cursor-pointer hover:bg-secondary-foreground/20 rounded-sm transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveSubject(subject);
                                            }}
                                        >
                                            <X className="h-3 w-3 opacity-70 group-hover:opacity-100 hover:text-destructive" />
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border border-dashed rounded-lg bg-muted/10 text-center">
                                <p className="text-sm text-muted-foreground">Select up to 3 subjects below</p>
                            </div>
                        )}

                        {/* Quick-Select Buttons */}
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Common Subjects</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {COMMON_SUBJECTS.map((subject) => {
                                    const isSelected = data.subjectTaught.includes(subject);
                                    const isDisabled = !isSelected && data.subjectTaught.length >= MAX_SUBJECTS;

                                    return (
                                        <Button
                                            key={subject}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleSubject(subject)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "h-9 text-xs transition-all duration-200",
                                                isSelected && "shadow-sm"
                                            )}
                                        >
                                            {subject}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Custom Subject Input */}
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Add Custom Subject</p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a subject name..."
                                    value={customSubjectInput}
                                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomSubject();
                                        }
                                    }}
                                    disabled={data.subjectTaught.length >= MAX_SUBJECTS}
                                    className="flex-1"
                                />
                                <Button 
                                    type="button" 
                                    onClick={handleAddCustomSubject}
                                    disabled={!customSubjectInput.trim() || data.subjectTaught.length >= MAX_SUBJECTS}
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* Validation Messages */}
                        <div className="space-y-1">
                            {!isSubjectValid && data.subjectTaught.length === 0 && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    Please select at least one subject
                                </div>
                            )}
                            {data.subjectTaught.length >= MAX_SUBJECTS && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    Maximum of {MAX_SUBJECTS} subjects selected
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Field 2: Preferred Note Format */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">
                                Preferred Lesson Note Format
                            </label>
                            {isNoteFormatValid && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <Select
                            value={data.preferredNoteFormat || ""}
                            onValueChange={(val) => {
                                setData({ preferredNoteFormat: val as PageThreeData["preferredNoteFormat"] });
                                if (!touched.preferredNoteFormat) {
                                    setTouched(prev => ({ ...prev, preferredNoteFormat: true }));
                                }
                            }}
                            onOpenChange={(open) => {
                                if (!open && !touched.preferredNoteFormat) {
                                    setTouched(prev => ({ ...prev, preferredNoteFormat: true }));
                                }
                            }}
                        >
                            <SelectTrigger className={cn(
                                "w-full h-12 px-4 rounded-lg border bg-background transition-all duration-200",
                                "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                showError('preferredNoteFormat') 
                                    ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                                    : data.preferredNoteFormat 
                                    ? "border-green-300 bg-green-50/50" 
                                    : "border-input hover:border-primary/50"
                            )}>
                                <SelectValue placeholder="Choose your preferred format" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border shadow-lg">
                                {NOTE_FORMAT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="py-3">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {showError('preferredNoteFormat') && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Please select a note format
                            </div>
                        )}
                    </div>

                    {/* Field 3: Curriculum Standard */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">
                                Curriculum Standard
                            </label>
                            {isCurriculumValid && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <Select
                            value={data.curriculumStandard || ""}
                            onValueChange={(val) => {
                                setData({ curriculumStandard: val as PageThreeData["curriculumStandard"] });
                                if (!touched.curriculumStandard) {
                                    setTouched(prev => ({ ...prev, curriculumStandard: true }));
                                }
                            }}
                            onOpenChange={(open) => {
                                if (!open && !touched.curriculumStandard) {
                                    setTouched(prev => ({ ...prev, curriculumStandard: true }));
                                }
                            }}
                        >
                            <SelectTrigger className={cn(
                                "w-full h-12 px-4 rounded-lg border bg-background transition-all duration-200",
                                "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                showError('curriculumStandard') 
                                    ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                                    : data.curriculumStandard 
                                    ? "border-green-300 bg-green-50/50" 
                                    : "border-input hover:border-primary/50"
                            )}>
                                <SelectValue placeholder="Select your curriculum standard" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border shadow-lg">
                                {CURRICULUM_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="py-3">
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {showError('curriculumStandard') && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Please select a curriculum standard
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-6">
                        <Button 
                            type="button"
                            variant="outline" 
                            onClick={onBack} 
                            disabled={loading}
                            className="gap-2 px-6"
                        >
                            Back
                        </Button>
                        <Button 
                            type="submit"
                            disabled={!isValid || loading}
                            className="gap-2 px-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Complete Setup
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}