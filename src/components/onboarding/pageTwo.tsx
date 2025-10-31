// src/components/onboarding/PageTwoTeaching.tsx
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import nigeria from "@/data/nigeria.json";
import { 
    CheckCircle, 
    AlertCircle, 
    ArrowLeft, 
    ArrowRight,
    School
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TEACHING_LEVELS = [
    { value: "basic_1_6", label: "Basic (Primary 1-6)" },
    { value: "jss_1_3", label: "JSS (JSS 1-3)" },
    { value: "sss_1_3", label: "SSS (SSS 1-3)" },
];

export type PageTwoData = {
    schoolState: string;
    localGovt: string;
    teachingLevels: ("basic_1_6" | "jss_1_3" | "sss_1_3")[];
};

interface PageTwoTeachingProps {
    data: PageTwoData;
    setData: (d: Partial<PageTwoData>) => void;
    onNext: () => void;
    onBack?: () => void;
}

export default function PageTwoTeaching({ data, setData, onNext, onBack }: PageTwoTeachingProps) {
    const [touched, setTouched] = useState({
        schoolState: false,
        localGovt: false,
        teachingLevels: false
    });

    const isValid = data.schoolState && data.localGovt && data.teachingLevels.length === 1;
    const selectedState = nigeria.find((s) => s.name === data.schoolState);
    const currentTeachingLevel = data.teachingLevels[0] || "";

    const handleLevelChange = (value: string) => {
        setData({ teachingLevels: [value as PageTwoData['teachingLevels'][number]] });
        if (!touched.teachingLevels) {
            setTouched(prev => ({ ...prev, teachingLevels: true }));
        }
    };

    const showError = (field: keyof typeof touched) => {
        return touched[field] && !data[field];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onNext();
        } else {
            setTouched({ schoolState: true, localGovt: true, teachingLevels: true });
        }
    };

    return (
        <Card className="w-full border-0 shadow-none">
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Help Text */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-start gap-3">
                            <School className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    School & Teaching Details
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Tell us about your school location and teaching level.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Field 1: School State */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">
                                School State
                            </label>
                            {data.schoolState && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        <div className="relative">
                            <Select
                                value={data.schoolState || ""}
                                onValueChange={(value) => {
                                    setData({ schoolState: value, localGovt: "" });
                                    if (!touched.schoolState) {
                                        setTouched(prev => ({ ...prev, schoolState: true }));
                                    }
                                }}
                            >
                                <SelectTrigger className={cn(
                                    "w-full h-12 px-4 rounded-lg border bg-background transition-all duration-200",
                                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                    showError('schoolState') 
                                        ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                                        : data.schoolState 
                                        ? "border-green-300 bg-green-50/50" 
                                        : "border-input hover:border-primary/50"
                                )}>
                                    <SelectValue placeholder="Select your school's state" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-lg border shadow-lg">
                                    {nigeria.map((state) => (
                                        <SelectItem key={state.name} value={state.name} className="py-3">
                                            {state.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {showError('schoolState') && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                              Please select your school&apos;s state
                            </div>
                        )}
                    </div>

                    {/* Field 2: Local Government */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">
                                Local Government Area (LGA)
                            </label>
                            {data.localGovt && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        <div className="relative">
                            <Select
                                value={data.localGovt || ""}
                                onValueChange={(value) => {
                                    setData({ localGovt: value });
                                    if (!touched.localGovt) {
                                        setTouched(prev => ({ ...prev, localGovt: true }));
                                    }
                                }}
                                disabled={!selectedState}
                            >
                                <SelectTrigger className={cn(
                                    "w-full h-12 px-4 rounded-lg border bg-background transition-all duration-200",
                                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                    !selectedState && "opacity-60 cursor-not-allowed",
                                    showError('localGovt') 
                                        ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                                        : data.localGovt 
                                        ? "border-green-300 bg-green-50/50" 
                                        : "border-input hover:border-primary/50"
                                )}>
                                    <SelectValue 
                                        placeholder={
                                            !selectedState 
                                                ? "Select a state first" 
                                                : "Select your local government"
                                        } 
                                    />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-lg border shadow-lg">
                                    {selectedState?.lgas.map((lga) => (
                                        <SelectItem key={lga} value={lga} className="py-3">
                                            {lga}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {showError('localGovt') && data.schoolState && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Please select your local government area
                            </div>
                        )}
                        {!selectedState && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                Select a state first to choose your LGA
                            </div>
                        )}
                    </div>
                    
                    {/* Field 3: Teaching Level */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">
                                Teaching Level
                            </label>
                            {data.teachingLevels.length === 1 && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        <div className="relative">
                            <Select
                                value={currentTeachingLevel}
                                onValueChange={handleLevelChange}
                            >
                                <SelectTrigger className={cn(
                                    "w-full h-12 px-4 rounded-lg border bg-background transition-all duration-200",
                                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                    showError('teachingLevels') 
                                        ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                                        : data.teachingLevels.length === 1 
                                        ? "border-green-300 bg-green-50/50" 
                                        : "border-input hover:border-primary/50"
                                )}>
                                    <SelectValue placeholder="Select your teaching level" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border shadow-lg">
                                    {TEACHING_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value} className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">
                                                    {level.label.split(' (')[0]}
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    {level.label.split(' (')[1]?.replace(')', '')}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {showError('teachingLevels') && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                Please select your teaching level
                            </div>
                        )}
                        
                        {/* Teaching Level Description */}
                        {currentTeachingLevel && (
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                <p className="text-sm ">
                                    {currentTeachingLevel === "basic_1_6" && 
                                        "Primary education level (ages 6-11)"}
                                    {currentTeachingLevel === "jss_1_3" && 
                                        "Junior Secondary School level (ages 12-14)"}
                                    {currentTeachingLevel === "sss_1_3" && 
                                        "Senior Secondary School level (ages 15-17)"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6">
                        <Button 
                            type="button"
                            variant="outline" 
                            onClick={onBack}
                            className="gap-2 px-6"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button 
                            type="submit"
                            disabled={!isValid}
                            className="gap-2 px-6"
                        >
                             Preferences
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}