// components/scheme/SchemeDialogs.tsx
"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Upload, FileText, Trash2, AlertTriangle
} from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  uploading: boolean;
  compressingImage: boolean;
  progress: number;
  onUpload: () => void;
  onCancel: () => void;
}

export function UploadDialog({
  open,
  onOpenChange,
  file,
  onFileChange,
  uploading,
  compressingImage,
  progress,
  onUpload,
  onCancel,
}: UploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Upload Scheme</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Image - Max 10MB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {compressingImage && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">Optimizing...</p>
                <p className="text-xs text-muted-foreground">Improving quality</p>
              </div>
            </div>
          )}

          <label
            htmlFor="scheme-file"
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-12 cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
          >
            <div className="p-3 sm:p-4 bg-primary/10 rounded-full mb-3 sm:mb-4">
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <p className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Click or drag & drop</p>
            <p className="text-xs sm:text-sm text-muted-foreground">clear image please </p>

            <Input
              id="scheme-file"
              type="file"
              accept=".pdf,.docx,.jpg,.png"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              disabled={uploading || compressingImage}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted rounded-xl border-2">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">{file.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-3 p-4 bg-primary/5 rounded-xl">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-primary">Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="w-full text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={uploading || compressingImage}
          >
            Cancel
          </Button>
          <Button 
            onClick={onUpload} 
            disabled={!file || uploading || compressingImage}
          >
            {uploading || compressingImage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {compressingImage ? 'Optimizing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToDashboard: () => void;
}

export function ProcessingDialog({
  open,
  onOpenChange,
  onGoToDashboard,
}: ProcessingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Processing Started</DialogTitle>
          <DialogDescription className="text-sm">Processing in background</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/5 p-4 sm:p-5 rounded-xl border-2 border-primary/20">
            <div className="flex gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <p className="font-semibold text-sm sm:text-base text-primary">What's happening?</p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Extracting text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Takes 30-60 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>You'll get notified</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onGoToDashboard} className="w-full">
            Go to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schemeTitle: string;
  isManuallyAdded: boolean;
  deleting: boolean;
  onConfirm: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  schemeTitle,
  isManuallyAdded,
  deleting,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-destructive/10 p-2 sm:p-3 rounded-full">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <DialogTitle className="text-destructive text-base sm:text-lg">Delete Scheme</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Cannot be undone. All {isManuallyAdded ? 'entries' : 'data'} will be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/5 border-2 border-destructive/20 rounded-xl p-3 sm:p-4">
          <p className="font-semibold mb-1 sm:mb-2 text-destructive text-sm">Deleting:</p>
          <p className="text-xs sm:text-sm truncate text-muted-foreground">{schemeTitle}</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}