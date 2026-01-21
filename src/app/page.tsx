import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  FileText,
  Upload,
  Sparkles,
  Brain,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Shield,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userName = session?.user?.name?.split(' ')[0] || "Teacher";

  const quickActions = [
    {
      title: "Upload Scheme of Work",
      description: "Upload your curriculum and let us extract the topics",
      icon: <Upload className="h-6 w-6" />,
      href: "/community/schemeOfWork",
      color: "bg-primary",
      badge: "Start Here",
      recommended: true,
    },
    {
      title: "View Curriculum",
      description: "Review your extracted scheme and weekly topics",
      icon: <Calendar className="h-6 w-6" />,
      href: "/community/schemeOfWork/viewSow",
      color: "bg-emerald-600",
    },
    {
      title: "Generate Lesson Notes",
      description: "AI-powered notes aligned with WAEC, NECO & JAMB",
      icon: <Brain className="h-6 w-6" />,
      href: "/lesson-notes",
      color: "bg-violet-600",
      badge: "AI-Powered",
    },
    {
      title: "My Lesson Notes",
      description: "Access all your generated lesson materials",
      icon: <FileText className="h-6 w-6" />,
      href: "/my-notes",
      color: "bg-blue-600",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Upload Your Scheme",
      description: "Upload your scheme of work image (clear photos work best)",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      step: "2",
      title: "AI Extraction",
      description: "Our assistant extracts weekly topics and organizes your curriculum",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      step: "3",
      title: "Generate Lessons",
      description: "Create curriculum-aligned lesson notes for each topic",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      step: "4",
      title: "Teach with Confidence",
      description: "Use WAEC, NECO & JAMB-aligned materials in your classroom",
      icon: <Target className="h-5 w-5" />,
    },
  ];

  const examBoards = [
    { name: "WAEC", description: "West African Examinations Council" },
    { name: "NECO", description: "National Examinations Council" },
    { name: "JAMB", description: "Joint Admissions and Matriculation Board" },
  ];

  const features = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: "Standard Lesson Format",
      description: "Includes Aims & Objectives, Introduction, Content, Activities, Evaluation & Conclusion",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Exam-Aligned Questions",
      description: "Questions and assignments follow WAEC, NECO & JAMB patterns and standards",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Save 10+ Hours Weekly",
      description: "Complete lesson notes ready for classroom delivery",
    },
  ];

  const lessonComponents = [
    { label: "Aims & Objectives", icon: <Target className="h-4 w-4" /> },
    { label: "Introduction", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Lesson Content", icon: <FileText className="h-4 w-4" /> },
    { label: "Activities & Observations", icon: <Users className="h-4 w-4" /> },
    { label: "Evaluation Questions", icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Assignments", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Conclusion & Summary", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Lesson Planning
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Welcome back, <span className="text-primary">{userName}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your scheme of work into professional lesson notes with exam-aligned 
              questions following WAEC, NECO, and JAMB standards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-base font-semibold" asChild>
                <Link href="/community/schemeOfWork">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Scheme of Work
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link href="/how-it-works">
                  <BookOpen className="mr-2 h-5 w-5" />
                  How It Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Quick Actions</h2>
          <p className="text-muted-foreground">
            Everything you need to create amazing lesson notes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.href}>
              <Card className={`group hover:shadow-lg transition-all cursor-pointer h-full ${
                action.recommended ? 'border-2 border-primary' : 'border hover:border-primary/50'
              }`}>
                {action.badge && (
                  <Badge className="absolute top-3 right-3 z-10" variant={action.recommended ? "default" : "secondary"}>
                    {action.badge}
                  </Badge>
                )}
                <CardHeader className="pb-4">
                  <div
                    className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Open
                    <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 border-y py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">How SmartNote Works</h2>
            <p className="text-muted-foreground text-lg">
              From scheme upload to lesson delivery in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative">
                <Card className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-3">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
                      {item.icon}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Board Alignment */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <Shield className="h-3 w-3 mr-1" />
            Curriculum Alignment
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Aligned with Nigerian Exam Standards
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every lesson note is generated following the official curriculum standards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {examBoards.map((board, idx) => (
            <Card key={idx} className="border-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{board.name}</CardTitle>
                <CardDescription className="text-sm">
                  {board.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-y py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Why Teachers Love SmartNote</h2>
            <p className="text-muted-foreground text-lg">
              Built specifically for Nigerian educators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, idx) => (
              <Card key={idx} className="text-center border-0 shadow-none bg-transparent">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lesson Note Components */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">
            <FileText className="h-3 w-3 mr-1" />
            Professional Format
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Complete Lesson Note Structure
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every generated lesson follows the standard school format for professional teaching
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-6xl mx-auto">
          {lessonComponents.map((component, idx) => (
            <Card key={idx} className="border hover:border-primary/50 transition-all">
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mx-auto">
                  {component.icon}
                </div>
                <p className="text-xs font-medium leading-tight">{component.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Exam Board Standards Compliance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All evaluation questions, class activities, and assignments are carefully crafted to match 
                  <strong className="text-foreground"> WAEC, NECO, and JAMB</strong> question patterns, 
                  difficulty levels, and curriculum requirements. Students practice with exam-standard materials 
                  from day one.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                Ready to Save Hours on Lesson Planning?
              </h2>
              <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                Upload your scheme of work and let our AI generate comprehensive, 
                curriculum-aligned lesson notes in minutes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" className="text-base font-semibold" asChild>
                <Link href="/community/schemeOfWork">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Your Scheme Now
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base border-primary-foreground/20 text-primary-foreground bg-green-600 hover:bg-green-700 hover:border-green-700"
                asChild
              >
                <Link href="/demo">
                  <Sparkles className="mr-2 h-5 w-5" />
                  See How It Works
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}