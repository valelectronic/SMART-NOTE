"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import  {toast} from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  FileEdit,
  Download,
  Printer,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loading from "@/app/loading";

interface WeekData {
  weekNumber: number | string;
  topicTitle: string;
  content: string;
}

const OPTIONAL_CONTENT_TOPICS = [
  "midterm break",
  "mid-term break",
  "midterm test",
  "mid-term test",
  "revision",
  "examination",
  "exam",
  "test",
  "break",
  "holiday",
];

export default function ViewSchemeOfWorkPage() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScheme = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ CRITICAL: Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/scheme/currentSOW?t=${timestamp}`, {
        cache: "no-store", // Force fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load`);
      const data = await res.json();
      
      console.log("=== VIEW PAGE: Data fetched ===");
      console.log("Full response:", data);
      
      const extractedText =
        data.scheme?.sowExtractedText || data.scheme?.extractedText;

      console.log("Extracted text length:", extractedText?.length);

      if (data.success && extractedText) {
        const parsed = JSON.parse(extractedText);
        console.log("Parsed weeks:", parsed);
        
        const transformedWeeks = Array.isArray(parsed)
          ? parsed.map((week: any) => ({
              weekNumber: week.weekNumber || week.week || 1,
              topicTitle: week.topicTitle || week.topic || "",
              content: week.content || week.topicContent || "",
            }))
          : [];
        
        console.log(`Setting ${transformedWeeks.length} weeks in state`);
        setWeeks(transformedWeeks);
        setError(null);
      } else {
        console.warn("No scheme data found");
        setError("No scheme found");
      }
    } catch (err) {
      console.error("Load error:", err);
      toast.error("Error loading curriculum data");
      setError(err instanceof Error ? err.message : "Failed to load scheme");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScheme();
  }, [loadScheme]);

  const isOptionalContentTopic = (topicTitle: string): boolean => {
    const normalized = topicTitle.toLowerCase().trim();
    return OPTIONAL_CONTENT_TOPICS.some((keyword) =>
      normalized.includes(keyword)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textContent = weeks
      .map(
        (week) =>
          `Week ${week.weekNumber}: ${week.topicTitle}\n${week.content}\n\n`
      )
      .join("");
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scheme-of-work-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File exported successfully");
  };

 const handleDelete = async () => {
    toast("Delete Scheme of Work?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            setLoading(true);
            const res = await fetch("/api/scheme/deleteScheme", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            toast.success("Scheme deleted successfully"); //  Success Toast
            setWeeks([]);
            router.push("/community/schemeOfWork/editScheme");
          } catch (error) {
            toast.error("Could not delete scheme. Try again."); //  Error Toast
          } finally {
            setLoading(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(),
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || weeks.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/community/schemeOfWork/editScheme")}
                size="icon"
              >
                <Upload />
              </Button>
              <h1 className="text-lg font-bold">Add scheme of work</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-20">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="rounded-full bg-muted p-6">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">No Scheme of Work Yet</h2>
                <p className="text-muted-foreground max-w-md">
                  You haven't created a scheme of work yet. Get started by
                  creating your first curriculum plan.
                </p>
              </div>
              <Button
                onClick={() => router.push("/community/schemeOfWork/editScheme")}
                size="lg"
                className="mt-4"
              >
                <FileEdit className="mr-2 h-4 w-4" />
                Create Scheme of Work
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const completedWeeks = weeks.filter((w) => {
    const hasTitle = w.topicTitle.trim().length > 0;
    const hasContent = w.content.trim().length > 0;
    const contentOptional = isOptionalContentTopic(w.topicTitle);
    return hasTitle && (hasContent || contentOptional);
  }).length;

  const completionRate =
    weeks.length > 0 ? Math.round((completedWeeks / weeks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b shadow-sm print:static print:shadow-none">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                size="icon"
                className="print:hidden flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold truncate">Scheme of Work</h1>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {weeks.length} week{weeks.length !== 1 ? 's' : ''} planned
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex gap-2 print:hidden flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => router.push("/community/schemeOfWork/editScheme")}
                size="sm"
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Mobile Actions - Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden print:hidden">
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/community/schemeOfWork/editScheme")}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Scheme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5 md:gap-2 print:hidden">
            <StatsCard
              label="Total"
              value={weeks.length}
              icon={<Calendar className="h-3 w-3 md:h-4 md:w-4" />}
            />
            <StatsCard
              label="Done"
              value={completedWeeks}
              icon={<CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />}
            />
            <StatsCard
              label="Progress"
              value={`${completionRate}%`}
              icon={<AlertCircle className="h-3 w-3 md:h-4 md:w-4" />}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Desktop Table View */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Weekly Curriculum Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Week</TableHead>
                    <TableHead className="w-1/3">Topic</TableHead>
                    <TableHead>Content & Activities</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeks.map((week, idx) => {
                    const contentOptional = isOptionalContentTopic(
                      week.topicTitle
                    );
                    const isComplete =
                      week.topicTitle.trim() &&
                      (week.content.trim() || contentOptional);

                    return (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="font-bold">
                          <Badge variant="outline">Week {week.weekNumber}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {week.topicTitle || (
                            <span className="text-muted-foreground italic">
                              No topic
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {contentOptional ? (
                            <Badge variant="secondary" className="text-xs">
                              {week.topicTitle}
                            </Badge>
                          ) : week.content ? (
                            <p className="whitespace-pre-wrap">
                              {week.content}
                            </p>
                          ) : (
                            <span className="text-muted-foreground italic">
                              No content
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {weeks.map((week, idx) => {
            const contentOptional = isOptionalContentTopic(week.topicTitle);
            const isComplete =
              week.topicTitle.trim() &&
              (week.content.trim() || contentOptional);

            return (
              <Card
                key={idx}
                className={`border-l-4 ${
                  isComplete ? "border-l-green-500" : "border-l-amber-500"
                }`}
              >
                <CardHeader className="pb-3 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-bold text-xs">
                      Week {week.weekNumber}
                    </Badge>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base mt-2 leading-tight">
                    {week.topicTitle || (
                      <span className="text-muted-foreground italic font-normal">
                        No topic
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  {contentOptional ? (
                    <Badge variant="secondary" className="text-xs">
                      {week.topicTitle}
                    </Badge>
                  ) : week.content ? (
                    <p className="text-xs md:text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {week.content}
                    </p>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground italic">
                      No content specified
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card/50">
      <CardContent className="p-2 md:p-3 text-center">
        <div className="flex items-center justify-center gap-0.5 md:gap-1 mb-0.5 md:mb-1">
          {icon}
          <p className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase">
            {label}
          </p>
        </div>
        <p className="text-base md:text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}