import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Sparkles,
  Brain,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowRight,
  Clock,
  GraduationCap,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userName = session?.user?.name?.split(' ')[0] || "Teacher";

  const quickActions = [
    {
      title: "Upload Scheme",
      description: "Start by uploading your curriculum",
      icon: <Upload className="h-5 w-5" />,
      href: "/community/schemeOfWork",
      color: "bg-blue-600",
      badge: "Start Here",
    },
    {
      title: "View Curriculum",
      description: "Review extracted topics",
      icon: <Calendar className="h-5 w-5" />,
      href: "/community/schemeOfWork/viewSow",
      color: "bg-emerald-600",
    },
    {
      title: "Generate Notes",
      description: "Smart lesson creation",
      icon: <Brain className="h-5 w-5" />,
      href: "/myNotes/lessonNote/generateNotes",
      color: "bg-violet-600",
    },
    {
      title: "My Notes",
      description: "Access saved lessons",
      icon: <FileText className="h-5 w-5" />,
      href: "/myNotes/lessonNote",
      color: "bg-orange-600",
    },
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Save 10+ Hours Weekly",
      description: "Complete lesson notes ready in minutes",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Exam-Aligned Content",
      description: "WAEC, NECO & JAMB standards for secondary",
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Primary 1-6 Support",
      description: "Age-appropriate content for young learners",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Clean & Focused */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-violet-50 dark:from-blue-950/20 dark:via-background dark:to-violet-950/20" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Smart Lesson Planning
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your scheme of work into professional lesson notes for Primary and Secondary classes in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
              <Button size="lg" className="text-base h-12 sm:h-14 px-6 sm:px-8" asChild>
                <Link href="/community/schemeOfWork">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Scheme of Work
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base h-12 sm:h-14 px-6 sm:px-8" 
                asChild
              >
                <Link href="/how-it-works">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Streamlined */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Quick Actions</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Everything you need in one place
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.href} className="group">
              <Card className="relative h-full border-2 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
                {action.badge && (
                  <Badge className="absolute -top-2 -right-2 z-10 shadow-md">
                    {action.badge}
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div
                    className={`${action.color} w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  <CardTitle className="text-base sm:text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    Open
                    <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits - Simple & Clear */}
      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Why Teachers Choose SmartNote</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Built for Nigerian educators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center space-y-3 sm:space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                  {benefit.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">{benefit.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Three simple steps to better lesson planning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <div className="relative text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl mx-auto">
              1
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Upload</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload/Add your scheme of work image
            </p>
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-6 -right-4 w-8 h-0.5 bg-border" />
          </div>

          <div className="relative text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl mx-auto">
              2
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Extract</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
             We Analyze and structure your curriculum
            </p>
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-6 -right-4 w-8 h-0.5 bg-border" />
          </div>

          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl mx-auto">
              3
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">Generate</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create complete lesson notes instantly
            </p>
          </div>
        </div>
      </section>

      {/* Education Levels - New Section */}
      <section className="border-y bg-gradient-to-br from-blue-50/50 via-background to-violet-50/50 dark:from-blue-950/10 dark:via-background dark:to-violet-950/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Supporting All Education Levels</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              From foundational learning to exam preparation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
            <Card className="border-2 hover:border-blue-500 hover:shadow-lg transition-all">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Primary 1-6</CardTitle>
                <CardDescription className="text-sm sm:text-base pt-2">
                  Age-appropriate content with engaging activities for young learners
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-violet-500 hover:shadow-lg transition-all">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">Secondary</CardTitle>
                <CardDescription className="text-sm sm:text-base pt-2">
                  WAEC, NECO & JAMB aligned materials for exam success
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Clean & Subtle */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-8 sm:p-10 lg:p-12 text-center text-white">
            <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                Ready to Transform Your Lesson Planning?
              </h2>
              <p className="text-base sm:text-lg text-blue-50">
                Join hundreds of teachers saving time with our Smart lesson notes
              </p>
              <div className="pt-2">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-base h-12 sm:h-14 px-6 sm:px-8 font-semibold" 
                  asChild
                >
                  <Link href="/community/schemeOfWork">
                    <Upload className="mr-2 h-5 w-5" />
                    Get Started Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Spacer for footer */}
      <div className="h-8 sm:h-12" />
    </div>
  );
}