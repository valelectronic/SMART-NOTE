"use client"

import PageOnePersonal from "@/components/onboarding/pageOne"
import PageTwoSkills from "@/components/onboarding/pageTwo"
import PageThreeSchedule from "@/components/onboarding/pageThree"
import { Progress } from "@/components/ui/progress"
import { useState, useTransition } from "react"
import { saveOnboardingAction } from "@/controllers/onboarding.controller"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BookOpen, User, Settings} from "lucide-react"
import { Card } from "@/components/ui/card"
import Loading from "../loading"

type OnboardingData = {
    fullName: string
    schoolState: string
    localGovt: string
    schoolName: string
    schoolType: "government" | "private" | "mission" | "international" | ""
    teachingLevels: ("basic_1_6" | "jss_1_3" | "sss_1_3")[]
    subjectTaught: string[]
    preferredNoteFormat: "structured_table" | "paragraph_style" | "detailed_breakdown" | ""
    curriculumStandard: "national" | "waec" | "neco" | "state" | ""
}

const STEPS = [
    {
        label: "Personal Info",
        description: "Tell us about yourself",
        icon: User,
        progress: 33
    },
    {
        label: "Teaching Details", 
        description: "Your subjects and level",
        icon: BookOpen,
        progress: 66
    },
    {
        label: "Preferences",
        description: "Customize your experience",
        icon: Settings,
        progress: 100
    }
]

export default function OnboardingParent() {
    const router = useRouter()
    const [page, setPage] = useState(0)
    const [data, setData] = useState<OnboardingData>({
        fullName: "",
        schoolState: "",
        localGovt: "",
        schoolName: "",
        schoolType: "",
        teachingLevels: [],
        subjectTaught: [],
        preferredNoteFormat: "",
        curriculumStandard: "",
    })
    const [isPending, startTransition] = useTransition()
    const [isNavigating, setIsNavigating] = useState(false)

    const currentStep = STEPS[page]
    const progress = currentStep.progress

    const handleNext = () => {
        if (page < STEPS.length - 1) {
            setIsNavigating(true)
            setTimeout(() => {
                setPage(page + 1)
                setIsNavigating(false)
            }, 300)
        }
    }

    const handleBack = () => {
        if (page > 0) {
            setIsNavigating(true)
            setTimeout(() => {
                setPage(page - 1)
                setIsNavigating(false)
            }, 300)
        }
    }

    const handleFinish = () => {
        startTransition(async () => {
            try {
                const formData = new FormData()

                // Page 1 Fields
                formData.append("fullName", data.fullName) 
                formData.append("schoolName", data.schoolName)
                formData.append("schoolType", data.schoolType)
                formData.append("schoolState", data.schoolState)
                formData.append("localGovt", data.localGovt)

                // Page 2 Fields (Teaching)
                formData.append("subjectTaught", data.subjectTaught.join(',')) 
                formData.append("teachingLevel", data.teachingLevels.join(','))
                
                // Page 3 Fields (Details/Preferences)
                formData.append("preferredNoteFormat", data.preferredNoteFormat)
                formData.append("curriculumStandard", data.curriculumStandard)

                const res = await saveOnboardingAction(formData)
                if (res.success) {
                    toast.success("Profile setup complete! 🎉", {
                        description: "Welcome to your teaching dashboard"
                    })
                    router.push("/community/news-feed")
                } else {
                    toast.error("Setup incomplete", {
                        description: "Please check all fields and try again"
                    })
                }
            } catch (err) {
                console.error(err)
                toast.error("Something went wrong", {
                    description: "Please try again in a moment"
                })
            }
        })
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Simplified Header */}
            <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    {/* Step Info */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-muted-foreground">
                            Step {page + 1} of {STEPS.length} • {currentStep.label}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{currentStep.description}</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Step Dots */}
                    <div className="flex justify-center gap-3 mt-4">
                        {STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    index === page 
                                        ? 'bg-primary' 
                                        : index < page 
                                        ? 'bg-primary/50' 
                                        : 'bg-muted'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl">
                    {/* Animated Page Container */}
                    <div 
                        className={`transition-all duration-300 ${
                            isNavigating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
                        }`}
                    >
                        {page === 0 && (
                            <PageOnePersonal
                                data={data}
                                setData={(u) => setData((p) => ({ ...p, ...u }))}
                                onNext={handleNext}
                            />
                        )}
                        {page === 1 && (
                            <PageTwoSkills
                                data={data}
                                setData={(u) => setData((p) => ({ ...p, ...u }))}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {page === 2 && (
                            <PageThreeSchedule
                                data={data}
                                setData={(u) => setData((p) => ({ ...p, ...u }))}
                                onNext={handleFinish}
                                onBack={handleBack}
                                loading={isPending}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Loading Overlay */}
            {isPending && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="p-8 text-center shadow-lg">
                        <Loading />
                        <h3 className="text-lg font-semibold mb-2">Setting Up Your Account</h3>
                        <p className="text-muted-foreground">Almost ready...</p>
                    </Card>
                </div>
            )}
        </div>
    )
}