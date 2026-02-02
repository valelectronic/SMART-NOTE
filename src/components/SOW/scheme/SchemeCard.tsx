// components/scheme/SchemeCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, CheckCircle, AlertTriangle, Calendar, Edit, Eye, Trash2,
  PenSquare, ArrowRight, RefreshCw
} from "lucide-react";

interface Scheme {
  title: string;
  sowFileKey: string;
  uploadedAt: string;
  processingStatus: "pending" | "processing" | "complete" | "failed";
  sowErrorMessage?: string;
  isManuallyAdded?: boolean;
}

interface SchemeCardProps {
  scheme: Scheme;
  navigating: boolean;
  deleting: boolean;
  onNavigateToEdit: () => void;
  onNavigateToView: () => void;
  onDelete: () => void;
  onRetryProcessing: () => void;
}

export function SchemeCard({
  scheme,
  navigating,
  deleting,
  onNavigateToEdit,
  onNavigateToView,
  onDelete,
  onRetryProcessing,
}: SchemeCardProps) {
  const isProcessingComplete = scheme.processingStatus === 'complete';
  const isManuallyAdded = scheme.isManuallyAdded;

  return (
    <Card className="w-full shadow-xl border-2">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${
            isProcessingComplete
              ? 'bg-green-500/10'
              : scheme.processingStatus === 'failed'
              ? 'bg-destructive/10'
              : 'bg-primary/10'
          }`}>
            {isProcessingComplete ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            ) : scheme.processingStatus === 'failed' ? (
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            ) : (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-spin" />
            )}
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="text-base sm:text-lg md:text-xl truncate">{scheme.title}</CardTitle>
              
              <div className="flex flex-wrap gap-1.5">
                {isManuallyAdded && (
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-primary/10 text-primary rounded-full w-fit font-medium">
                    Manual Entry
                  </span>
                )}
                
                {!isManuallyAdded && isProcessingComplete && (
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-green-500/10 text-green-700 dark:text-green-300 rounded-full w-fit font-medium">
                    Ready
                  </span>
                )}
                {!isManuallyAdded && scheme.processingStatus === 'processing' && (
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-primary/10 text-primary rounded-full w-fit">
                    Processing...
                  </span>
                )}
                {!isManuallyAdded && scheme.processingStatus === 'pending' && (
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-muted text-muted-foreground rounded-full w-fit">
                    Queued
                  </span>
                )}
                {!isManuallyAdded && scheme.processingStatus === 'failed' && (
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-destructive/10 text-destructive rounded-full w-fit">
                    Failed
                  </span>
                )}
              </div>
            </div>

            <CardDescription className="flex items-center gap-1 text-[10px] sm:text-xs">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {isManuallyAdded ? 'Created' : 'Uploaded'} {new Date(scheme.uploadedAt).toLocaleDateString()}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-3 sm:px-4 pt-4">
        {isManuallyAdded ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-card rounded-xl border">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <PenSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="font-semibold text-sm">Manual Entry</p>
                <p className="text-xs text-muted-foreground">
                  View and manage
                </p>
              </div>
            </div>
            
            <Button
              onClick={onNavigateToView}
              className="w-full h-11 sm:h-12 gap-2 text-sm sm:text-base font-semibold"
              size="lg"
              disabled={navigating}
            >
              {navigating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>View Scheme</span>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </div>
        ) : isProcessingComplete ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
              <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="font-semibold text-sm text-green-900 dark:text-green-100">
                  Extraction Complete!
                </p>
                <p className="text-xs text-green-700 dark:text-green-200">
                  Ready to review and customize
                </p>
              </div>
            </div>
            
            <Button
              onClick={onNavigateToEdit}
              className="w-full h-11 sm:h-12 gap-2 text-sm sm:text-base font-semibold bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={navigating}
            >
              {navigating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span>Review & Edit</span>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className={`p-6 rounded-xl border-2 ${
            scheme.processingStatus === 'failed' 
              ? 'bg-destructive/5 border-destructive/20' 
              : 'bg-primary/5 border-primary/20'
          }`}>
            <div className="flex flex-col items-center text-center gap-4">
              {scheme.processingStatus === 'failed' ? (
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
              ) : (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              )}
              
              <div className="space-y-2 max-w-sm">
                <p className={`text-lg font-bold ${
                  scheme.processingStatus === 'failed' ? 'text-destructive' : 'text-primary'
                }`}>
                  {scheme.processingStatus === 'failed' 
                    ? 'Extraction Failed' 
                    : 'Processing...'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {scheme.processingStatus === 'failed' 
                    ? scheme.sowErrorMessage || 'Try uploading a clearer image'
                    : 'Extracting text. Usually takes 30-60 seconds'}
                </p>
              </div>

              {scheme.processingStatus === 'failed' && (
                <Button
                  onClick={onRetryProcessing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              Delete Scheme
            </h3>
            <p className="text-muted-foreground text-xs">
              {isManuallyAdded 
                ? "Delete to start fresh"
                : "Delete to create new"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onDelete}
            className="gap-2 h-9 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}