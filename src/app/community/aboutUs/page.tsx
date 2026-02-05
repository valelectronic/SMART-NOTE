"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Users, Target, Zap, Heart, Globe, 
  GraduationCap, TrendingUp, Shield, Sparkles,
  AlertCircle, CheckCircle, FileText, Brain
} from "lucide-react";
import Link from "next/link";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12 sm:py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-primary/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              Empowering Nigerian Educators
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Aligning Teaching with
              <br />
              <span className="text-primary">Curriculum Standards</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed px-4">
              We're bridging the gap between classroom teaching and examination success by 
              providing AI-powered tools that align with Nigerian curriculum standards and 
              help students excel in their exams.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base h-11 sm:h-12" asChild>
                <Link href="/auth/sign-up">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base h-11 sm:h-12" asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">The Challenge We Discovered</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              A critical gap in Nigerian education that affects student success
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Problem Card */}
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-destructive/10 flex-shrink-0">
                    <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">What We Observed</h3>
                    <div className="h-1 w-16 bg-destructive rounded-full" />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Through extensive research and classroom observations, we discovered a troubling pattern:
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      </div>
                      <span className="text-muted-foreground">Teachers often teach without following official curriculum standards</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      </div>
                      <span className="text-muted-foreground">Lesson plans rarely incorporate past examination questions</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      </div>
                      <span className="text-muted-foreground">Students struggle during exams due to inadequate preparation</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      </div>
                      <span className="text-muted-foreground">Teachers lack resources to align teaching with examination requirements</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Solution Card */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Our Solution</h3>
                    <div className="h-1 w-16 bg-primary rounded-full" />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    We created an intelligent platform that ensures both teachers and students are exam-ready:
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Lesson plans aligned with official Nigerian curriculum standards</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">smart integration of past examination questions</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Comprehensive exam preparation tools for students</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Automated schemes of work following examination board requirements</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Impact Statement */}
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 sm:p-8 md:p-10 text-center">
              <div className="inline-flex p-3 sm:p-4 rounded-full bg-primary/10 mb-4 sm:mb-6">
                <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                Bridging the Gap Between Teaching and Exams
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Our platform ensures that every lesson taught prepares students for their examinations 
                while maintaining full alignment with curriculum standards. Teachers gain confidence, 
                students achieve better results, and the education system grows stronger.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                    <Target className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Our Mission</h2>
                    <div className="h-1 w-16 bg-primary rounded-full" />
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  To revolutionize education in Nigeria by providing teachers with intelligent, 
                  curriculum-aligned tools that integrate past examination questions into daily teaching. 
                  We empower educators to deliver exam-focused lessons while reducing administrative burden, 
                  ensuring every student is thoroughly prepared for academic success.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 flex-shrink-0">
                    <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Our Vision</h2>
                    <div className="h-1 w-16 bg-primary rounded-full" />
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  To become Africa's leading educational technology platform where every teacher 
                  confidently delivers curriculum-standard lessons, every student is exam-ready, 
                  and examination success rates soar across the continent. We envision a future 
                  where AI-driven education seamlessly bridges classroom teaching and examination excellence.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">How We Help Teachers & Students</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Three powerful ways we ensure exam success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: FileText,
                step: "01",
                title: "Curriculum-Aligned Lessons",
                description: "Our logic generates lesson plans that strictly follow Nigerian curriculum standards, ensuring nothing is missed."
              },
              {
                icon: BookOpen,
                step: "02",
                title: "Past Questions Integration",
                description: "Every lesson plan incorporates relevant past examination questions, giving students hands-on practice."
              },
              {
                icon: GraduationCap,
                step: "03",
                title: "Exam Preparation Tools",
                description: "Students get targeted practice materials and mock tests based on real examination patterns."
              }
            ].map((item, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 text-8xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <CardContent className="p-6 sm:p-8 relative">
                  <div className="mb-4 sm:mb-6">
                    <div className="inline-flex p-3 sm:p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">STEP {item.step}</div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Our Core Values</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: Heart,
                title: "Teachers First",
                description: "Every feature we build starts with understanding teachers' real needs and challenges."
              },
              {
                icon: Target,
                title: "Exam Excellence",
                description: "We're obsessed with helping students achieve outstanding examination results through proper preparation."
              },
              {
                icon: Shield,
                title: "Curriculum Integrity",
                description: "We ensure strict adherence to official curriculum standards in every resource we provide."
              },
              {
                icon: Users,
                title: "Community",
                description: "We're building a supportive network where educators can share best practices and grow together."
              },
              {
                icon: TrendingUp,
                title: "Continuous Improvement",
                description: "We constantly update our question banks and curriculum alignment based on latest examination trends."
              },
              {
                icon: Zap,
                title: "Innovation",
                description: "We leverage cutting-edge intelligence to solve the critical gap between teaching and exam success."
              }
            ].map((value, index) => (
              <Card 
                key={index} 
                className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
              >
                <CardContent className="p-5 sm:p-6 md:p-8">
                  <div className="mb-3 sm:mb-4">
                    <div className="inline-flex p-2.5 sm:p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <value.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">{value.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Our Story</h2>
            <div className="h-1 w-20 bg-primary rounded-full mx-auto" />
          </div>

          <Card className="border-2">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <div className="space-y-4 sm:space-y-6">
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  Our journey began when we spent months observing classrooms across Nigeria. What we 
                  discovered was eye-opening: talented, dedicated teachers were working tirelessly, yet 
                  their students were underperforming in examinations. The disconnect was clear—teaching 
                  wasn't aligned with curriculum standards or examination patterns.
                </p>
                
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  We spoke with hundreds of teachers who expressed the same frustration: "We don't have 
                  time to research past questions," "The curriculum is too broad to cover," "Students 
                  are surprised by exam formats." These weren't lazy teachers—they were overwhelmed 
                  educators lacking the right tools.
                </p>
                
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  That's when we knew we had to act. By combining our passion for education with 
                  expertise in artificial intelligence, we built a platform that automatically aligns 
                  every lesson with curriculum standards and integrates past examination questions. 
                  No more guesswork. No more surprises on exam day.
                </p>

                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  Today, thousands of teachers use our platform to ensure their students are exam-ready 
                  from day one. Examination pass rates are improving, teacher confidence is soaring, 
                  and students are finally achieving their full potential.
                </p>

                <div className="pt-4 sm:pt-6 border-t">
                  <p className="text-sm sm:text-base font-semibold text-primary mb-2">
                    Join us in closing the gap between teaching and examination success.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Together, we're ensuring every Nigerian student walks into their exams fully prepared.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { value: "10,000+", label: "Teachers Empowered" },
              { value: "50,000+", label: "Exam-Ready Lessons" },
              { value: "25,000+", label: "Past Questions Integrated" },
              { value: "99%", label: "Curriculum Coverage" }
            ].map((stat, index) => (
              <Card key={index} className="border-2 text-center hover:border-primary/50 transition-all">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Ready to Ensure Your Students Are Exam-Ready?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto px-4">
              Join Nigerian teachers who are transforming exam results with 
              curriculum-aligned lessons and integrated past questions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 px-4">
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full sm:w-auto text-sm sm:text-base h-11 sm:h-12 font-semibold"
                asChild
              >
                <Link href="/login">
                  Start Preparing Students Today
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-sm sm:text-base h-11 sm:h-12 bg-white/10 hover:bg-white/20 text-white border-white/30"
                asChild
              >
                <Link href="/">
                  See How It Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}