"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Loader2, Upload, FileText, Calendar, Edit, Camera,
  Trash2, AlertTriangle, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/app/loading";
  import imageCompression from 'browser-image-compression';

export interface Scheme {
  title: string
  sowFileKey: string
  uploadedAt: string
  processingStatus: "pending" | "processing" | "complete" | "failed"
  sowErrorMessage?: string
}

export type CloudinarySignature = {
  signature: string
  timestamp: number
  apiKey: string
}

export async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const timestamp = Math.floor(Date.now() / 1000)

  const res = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp,
      folder: "sow_uploads",
    }),
  })

  if (!res.ok) throw new Error("Failed to fetch upload signature")
  return res.json()
}

export default function SchemeOfWorkPage({ initialUserId }: { initialUserId: string | null }) {
  const userId = initialUserId;
  const router = useRouter();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUpload, setOpenUpload] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [showProcessingRedirect, setShowProcessingRedirect] = useState(false);
  const [hasShownStatusToast, setHasShownStatusToast] = useState(false);

  const SOW_MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Fetch current scheme
  const fetchScheme = useCallback(
    async (showLoader = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (showLoader) setLoading(true);

      try {
        const res = await fetch("/api/scheme/currentSOW", {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.success && data.scheme) {
          setScheme({
            title: data.scheme.sowTitle,
            sowFileKey: data.scheme.sowFileKey,
            uploadedAt: data.scheme.uploadedAt,
            processingStatus: data.scheme.processingStatus,
            sowErrorMessage: data.scheme.sowErrorMessage,
          });
        } else {
          setScheme(null);
        }
      } catch {
        setScheme(null);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [userId]
  );

  // Initial fetch
  useEffect(() => {
    if(userId){
      fetchScheme(true);
    }
  }, [fetchScheme, userId]);

  // Navigate to edit page
  const handleNavigateToEdit = useCallback(() => {
    setNavigating(true);
    router.push("/community/schemeOfWork/editScheme");
  }, [router]);

  // Handle camera click
  const handleCameraClick = useCallback(() => {
    if (typeof window === 'undefined') return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      input.capture = "environment";
    }

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setFile(target.files[0]);
        setOpenUpload(true);
      }
      input.remove();
    };

    input.click();
  }, []);

  // Handle file upload
  const handleUpload = useCallback(async () => {
  if (!file) {
    toast.error("Please select a file.");
    return;
  }

  setUploading(true);
  setProgress(0);
  
  try {
    let fileToUpload = file;

    // ✅ STEP 1: COMPRESS IF IT'S AN IMAGE
    if (file.type.startsWith('image/')) {
      const compressionOptions = {
        maxSizeMB: 1,          // Aim for ~1MB (perfect for AI reading)
        maxWidthOrHeight: 2048, // High enough for text clarity
        useWebWorker: true,
      };
      
      toast.info("Optimizing image for extraction...");
      fileToUpload = await imageCompression(file, compressionOptions);
    }

    // ✅ STEP 2: GET SIGNATURE
    const { signature, timestamp, apiKey } = await getCloudinarySignature();

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    const cloudForm = new FormData();
    // Use the potentially compressed fileToUpload
    cloudForm.append("file", fileToUpload); 
    cloudForm.append("api_key", apiKey);
    cloudForm.append("timestamp", String(timestamp));
    cloudForm.append("signature", signature);
    cloudForm.append("folder", "sow_uploads");

      const uploadResult = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Cloudinary upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(cloudForm);
      });

      const res = await fetch("/api/scheme/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sowFileKey: uploadResult.public_id,
          sowFileUrl: uploadResult.secure_url,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      const newScheme: Scheme = {
        title: result.sowTitle || file.name,
        sowFileKey: uploadResult.public_id,
        uploadedAt: new Date().toISOString(),
        processingStatus: result.processingStatus || 'pending',
      };

      setScheme(newScheme);
      setFile(null);
      setOpenUpload(false);
      toast.success("Scheme uploaded successfully!");
      setShowProcessingRedirect(true);
      setHasShownStatusToast(false);

    } catch (error: unknown) {
      console.error("SOW Upload Error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [scheme, file, userId]);

  // Redirect user while processing
  const navigateWhileProcessing = useCallback(() => {
    toast.info("We'll notify you when processing is complete!", {
      duration: 4000,
    });
    setShowProcessingRedirect(false);
    router.push("/");
  }, [router]);

  // Check if processing is done periodically
  useEffect(() => {
    if (
      scheme?.processingStatus === 'processing' ||
      scheme?.processingStatus === 'pending'
    ) {
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchScheme()
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [scheme?.processingStatus, fetchScheme]);

  // Show processing complete notification
  useEffect(() => {
    if (scheme?.processingStatus === 'complete' && !hasShownStatusToast) {
      toast.success("Scheme processing complete! Ready to edit.", {
        duration: 8000,
        action: {
          label: "Edit Now",
          onClick: () => handleNavigateToEdit(),
        },
      });
      setHasShownStatusToast(true);
    } else if (scheme?.processingStatus === 'failed' && !hasShownStatusToast) {
      toast.error(`Processing failed: ${scheme.sowErrorMessage || "Unknown error"}. Please try again.`, {
        duration: 8000,
      });
      setHasShownStatusToast(true);
    }
  }, [scheme?.processingStatus, scheme?.sowErrorMessage, handleNavigateToEdit, hasShownStatusToast]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!scheme?.sowFileKey) {
      toast.error("No file key found to delete.");
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(
        `/api/cloudinary/SOWdelete?key=${encodeURIComponent(scheme.sowFileKey)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Failed to delete scheme");

      setScheme(null);
      setOpenDelete(false);
      setHasShownStatusToast(false);
      toast.success("Scheme deleted successfully");
    } catch (error: unknown) {
      console.error("Delete Error:", error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [scheme?.sowFileKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loading />
      </div>
    );
  }

  const isProcessingComplete = scheme?.processingStatus === 'complete';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Scheme of Work</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            {!scheme 
              ? "Upload your scheme to get started"
              : isProcessingComplete
              ? "Edit your scheme to customize it"
              : "Processing your scheme"}
          </p>
        </div>

        {scheme ? (
          <Card className="w-full">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Status Icon */}
                <div className={`p-2 sm:p-3 rounded-lg ${
                  isProcessingComplete
                    ? 'bg-green-500/10'
                    : scheme.processingStatus === 'failed'
                    ? 'bg-destructive/10'
                    : 'bg-primary/10'
                }`}>
                  {isProcessingComplete ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  ) : scheme.processingStatus === 'failed' ? (
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                  ) : (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-spin" />
                  )}
                </div>

                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <CardTitle className="text-lg sm:text-2xl truncate">{scheme.title}</CardTitle>
                    
                    {/* Status Badge */}
                    {isProcessingComplete && (
                      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-700 rounded-full w-fit font-medium">
                        ✓ Ready to Edit
                      </span>
                    )}
                    {scheme.processingStatus === 'processing' && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full w-fit">
                        Processing...
                      </span>
                    )}
                    {scheme.processingStatus === 'pending' && (
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full w-fit">
                        Queued
                      </span>
                    )}
                    {scheme.processingStatus === 'failed' && (
                      <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full w-fit">
                        Failed
                      </span>
                    )}
                  </div>

                  <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">
                      Uploaded {new Date(scheme.uploadedAt).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              {/* Action Button - ONLY Edit Scheme */}
              {isProcessingComplete && (
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 sm:p-7 border-2">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Processing Complete
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-200">
                          Your scheme is ready. Click below to review and customize it.
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleNavigateToEdit}
                      className="w-full h-14 gap-3 text-base font-semibold shadow-lg"
                      size="lg"
                      disabled={navigating}
                    >
                      {navigating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Opening Editor...</span>
                        </>
                      ) : (
                        <>
                          <Edit className="h-5 w-5" />
                          <span>Edit Scheme</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Processing Status Message */}
              {!isProcessingComplete && (
                <div className={`p-4 rounded-xl border-2 ${
                  scheme.processingStatus === 'failed' 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : 'bg-primary/10 border-primary/20'
                }`}>
                  <div className="flex items-start gap-3">
                    {scheme.processingStatus === 'failed' ? (
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5 flex-shrink-0" />
                    )}
                    <div className="space-y-1 min-w-0">
                      <p className={`font-semibold ${
                        scheme.processingStatus === 'failed' ? 'text-destructive' : 'text-primary'
                      }`}>
                        {scheme.processingStatus === 'failed' 
                          ? 'Processing Failed' 
                          : 'Processing Your Scheme...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {scheme.processingStatus === 'failed' 
                          ? scheme.sowErrorMessage || 'An error occurred. Please delete and try again.'
                          : 'We\'re extracting and organizing your content. You\'ll receive a notification when ready.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Section */}
              <div className="pt-4 sm:pt-6 border-t space-y-3">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold">Manage Scheme</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Delete your current scheme to upload a new one
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setOpenDelete(true)}
                  className="gap-2 h-10 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Delete Scheme</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Empty State - No Scheme Uploaded */
          <Card className="w-full text-center border-2 border-dashed">
            <CardContent className="pt-12 pb-16 px-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>

              <h3 className="text-2xl font-bold mb-3">No Scheme of Work</h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Get started by uploading your Scheme of Work document.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setOpenUpload(true)}
                  className="gap-2 h-12 text-base"
                  size="lg"
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload File</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 h-12 text-base"
                  size="lg"
                  onClick={handleCameraClick}
                >
                  <Camera className="h-5 w-5" />
                  <span>Use Camera</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={openUpload} onOpenChange={setOpenUpload}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Scheme of Work</DialogTitle>
              <DialogDescription>
                Upload your scheme document (PDF, DOCX, or Image - Max 10MB)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <label
                htmlFor="scheme-file"
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 cursor-pointer hover:border-primary transition"
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-medium mb-1">Click to browse or drag & drop</p>
                <p className="text-sm text-muted-foreground">PDF, DOCX, JPG, or PNG</p>

                <Input
                  id="scheme-file"
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenUpload(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Processing Redirect Dialog */}
        <Dialog open={showProcessingRedirect} onOpenChange={setShowProcessingRedirect}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Processing Started!</DialogTitle>
              <DialogDescription>
                Your scheme is being processed in the background.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-primary">What's happening?</p>
                    <ul className="text-sm text-primary/90 space-y-1 list-disc list-inside">
                      <li>Extracting text from your document</li>
                      <li>Processing may take 30-60 seconds</li>
                      <li>You will get a notification when ready</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={navigateWhileProcessing} className="w-full">
                Go to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-destructive/10 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-destructive">Delete Scheme</DialogTitle>
              </div>
              <DialogDescription>
                This action cannot be undone. All extracted data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="font-medium mb-1">You are about to delete:</p>
              <p className="text-sm truncate">{scheme?.title}</p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}