// src/components/onboarding/PageOnePersonal.tsx
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/db/auth.client";
import { useEffect, useState } from "react";
import { User, Building2, BookOpenCheck, CheckCircle, ArrowRight, AlertCircle, Lightbulb } from "lucide-react";

const SCHOOL_TYPE_OPTIONS = [
    { value: "government", label: "Government (Public)" },
    { value: "private", label: "Private" },
    { value: "mission", label: "Mission/Faith-Based" },
    { value: "international", label: "International" },
];

type PageOneData = {
    fullName: string;
    schoolName: string;
    schoolType: "government" | "private" | "mission" | "international" | "";
};

interface PageOnePersonalProps {
    data: PageOneData;
    setData: (d: Partial<PageOneData>) => void;
    onNext: () => void;
}

export default function PageOnePersonal({
    onNext,
    data,
    setData,
}: PageOnePersonalProps) {
    const { data: session } = useSession();
    const user = session?.user;
    const [touched, setTouched] = useState({
        schoolName: false,
        schoolType: false
    });

    useEffect(() => {
        if (user?.name && !data.fullName) {
            setData({ fullName: user.name });
        }
    }, [user?.name, data.fullName, setData]);

    const isValid = data.fullName && data.schoolName && data.schoolType;

    const showError = (field: keyof typeof touched) => {
        return touched[field] && !data[field];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onNext();
        } else {
            setTouched({ schoolName: true, schoolType: true });
        }
    };

    return (
        <Card className="w-full border-0 shadow-none">
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Help Text */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    Let&apos;s get you set up
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    This helps us personalize your experience with relevant teaching resources.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Field 1: Full Name (Read-Only) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Full Name
                            </label>
                            {data.fullName && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        <div
                            className={cn(
                                "w-full rounded-lg border-2 px-4 py-3.5 transition-all duration-200",
                                "cursor-not-allowed",
                                data.fullName 
                                    ? "border-green-200 bg-green-50/30" 
                                    : "border-border bg-muted/50"
                            )}
                        >
                            <span className={cn(
                                "font-medium text-sm",
                                data.fullName ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {data.fullName || "Loading..."}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Automatically filled from your account
                        </p>
                    </div>

                    {/* Field 2: School Name */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                School Name
                            </label>
                            {data.schoolName && !showError('schoolName') && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                placeholder="Enter your school name"
                                value={data.schoolName}
                                onChange={(e) => {
                                    setData({ schoolName: e.target.value });
                                    if (!touched.schoolName) {
                                        setTouched(prev => ({ ...prev, schoolName: true }));
                                    }
                                }}
                                onBlur={() => setTouched(prev => ({ ...prev, schoolName: true }))}
                                className={cn(
                                    "h-11 rounded-lg border-2 transition-all duration-200 pr-10",
                                    showError('schoolName') 
                                        ? "border-destructive focus:border-destructive" 
                                        : data.schoolName 
                                        ? "border-green-200 focus:border-green-300" 
                                        : "border-border focus:border-primary"
                                )}
                            />
                        </div>
                        {showError('schoolName') && (
                            <div className="flex items-center gap-2 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                School name is required
                            </div>
                        )}
                    </div>
                    
                    {/* Field 3: School Type */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <BookOpenCheck className="h-4 w-4 text-primary" />
                                School Type
                            </label>
                            {data.schoolType && !showError('schoolType') && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </div>
                        <div className="relative">
                            <Select
                                value={data.schoolType || ""}
                                onValueChange={(value) => {
                                    setData({ schoolType: value as PageOneData['schoolType'] });
                                    if (!touched.schoolType) {
                                        setTouched(prev => ({ ...prev, schoolType: true }));
                                    }
                                }}
                                onOpenChange={(open) => {
                                    if (!open && !touched.schoolType) {
                                        setTouched(prev => ({ ...prev, schoolType: true }));
                                    }
                                }}
                            >
                                <SelectTrigger className={cn(
                                    "h-11 rounded-lg border-2 transition-all duration-200 pr-10",
                                    showError('schoolType') 
                                        ? "border-destructive focus:border-destructive" 
                                        : data.schoolType 
                                        ? "border-green-200 focus:border-green-300" 
                                        : "border-border focus:border-primary"
                                )}>
                                    <SelectValue placeholder="Select school type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SCHOOL_TYPE_OPTIONS.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {showError('schoolType') && (
                            <div className="flex items-center gap-2 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                Please select your school type
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <Button 
                            type="submit"
                            disabled={!isValid}
                            className="w-full gap-2 h-11"
                        >
                            Continue to Teaching Details
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}