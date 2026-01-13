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
  Trash2, AlertTriangle, Eye, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/app/loading";

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
  const [navigating, setNavigating] = useState<"edit" | "view" | null>(null);
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

    // 👇 only show loader when we ask for it
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
      // 👇 only stop loading if we started it
      if (showLoader) setLoading(false);
    }
  },
  [userId]
);
// Initial fetch
 useEffect(() => {
  if(userId){
  fetchScheme(true); // Show loader on initial fetch
  }

}, [fetchScheme, userId]);

  // Navigate to edit or view page
  const handleNavigate = useCallback((destination: "edit" | "view") => {
    setNavigating(destination);
    router.push(`/community/schemeOfWork/${destination === "edit" ? "editScheme" : "viewSow"}`);
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
    if (scheme) {
      toast.error("You already have a Scheme. Delete it first.");
      return;
    }

    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    if (!userId) {
      toast.error("Session expired. Please log in.");
      return;
    }

    if (file.size > SOW_MAX_FILE_SIZE) {
      toast.error("File must be under 10MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      // 1 Get Cloudinary signature
      const { signature, timestamp, apiKey } = await getCloudinarySignature();

      // 2 Upload to Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary not configured");
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const cloudForm = new FormData();
      cloudForm.append("file", file);
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

      // 3 Save metadata to DB
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

      // 4 IMMEDIATELY update the UI with the new scheme
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
      // Show the processing redirect modal
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
    
    // Redirect to dashboard or another useful page
    router.push("/");
  }, [router]);

  // Check if processing is done periodically (less intrusive)
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
          onClick: () => handleNavigate("edit"),
        },
      });
      setHasShownStatusToast(true);
    } else if (scheme?.processingStatus === 'failed' && !hasShownStatusToast) {
      toast.error(`Processing failed: ${scheme.sowErrorMessage || "Unknown error"}. Please try again.`, {
        duration: 8000,
      });
      setHasShownStatusToast(true);
    }
  }, [scheme?.processingStatus, scheme?.sowErrorMessage, handleNavigate, hasShownStatusToast]);

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Scheme of Work</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            {scheme ? "Manage your current scheme" : "Upload your scheme to get started"}
          </p>
        </div>

        {scheme ? (
          <Card className="w-full">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg ${
                  scheme.processingStatus === 'complete' 
                    ? 'bg-primary/10' 
                    : scheme.processingStatus === 'failed'
                    ? 'bg-destructive/10'
                    : 'bg-primary/10'
                }`}>
                  {scheme.processingStatus === 'complete' ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  ) : scheme.processingStatus === 'failed' ? (
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                  ) : (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-spin" />
                  )}
                </div>
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <CardTitle className="text-lg sm:text-2xl truncate">{scheme.title}</CardTitle>
                    {scheme.processingStatus === 'processing' && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full w-fit">
                        Processing
                      </span>
                    )}
                    {scheme.processingStatus === 'pending' && (
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full w-fit">
                        Queued
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
              {/* Action Buttons */}
              <div className="bg-muted/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <Button
                    onClick={() => handleNavigate("edit")}
                    className="h-10 sm:h-12 gap-2 sm:gap-3 text-sm sm:text-base"
                    size="lg"
                    disabled={navigating === "edit" || scheme.processingStatus !== 'complete'}
                  >
                    {navigating === "edit" ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">Edit Scheme</span>
                        <span className="xs:hidden">Edit</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleNavigate("view")}
                    className="h-10 sm:h-12 gap-2 sm:gap-3 text-sm sm:text-base"
                    size="lg"
                    disabled={navigating === "view" || scheme.processingStatus !== 'complete'}
                  >
                    {navigating === "view" ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">View Scheme</span>
                        <span className="xs:hidden">View</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Status Message */}
              {scheme.processingStatus !== 'complete' && (
                <div className={`p-3 sm:p-4 rounded-lg border ${
                  scheme.processingStatus === 'failed' 
                    ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                    : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    {scheme.processingStatus === 'failed' ? (
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mt-0.5 flex-shrink-0" />
                    )}
                    <div className="space-y-0.5 sm:space-y-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">
                        {scheme.processingStatus === 'failed' 
                          ? 'Processing Failed' 
                          : 'Processing in Background'}
                      </p>
                      <p className="text-xs sm:text-sm">
                        {scheme.processingStatus === 'failed' 
                          ? scheme.sowErrorMessage || 'Please delete and try again.'
                          : 'Your scheme is being processed. You will receive a notification when ready.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Section */}
              <div className="pt-4 sm:pt-6 border-t space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">Manage Scheme</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Delete your current scheme to upload a new one
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setOpenDelete(true)}
                  className="gap-2 sm:gap-3 h-9 sm:h-11 text-sm sm:text-base text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  size="lg"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                  <span className="hidden xs:inline">Delete Scheme</span>
                  <span className="xs:hidden">Delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Empty State */
          <Card className="w-full text-center border-2 border-dashed">
            <CardContent className="pt-8 sm:pt-12 pb-10 sm:pb-16 px-4 sm:px-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">No Scheme of Work</h3>
              <p className="text-muted-foreground text-sm sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
                Get started by uploading your scheme of work.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => setOpenUpload(true)}
                  className="gap-2 sm:gap-3 h-10 sm:h-12 text-sm sm:text-base"
                  size="lg"
                >
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Upload File</span>
                  <span className="xs:hidden">Upload</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 sm:gap-3 h-10 sm:h-12 text-sm sm:text-base"
                  size="lg"
                  onClick={handleCameraClick}
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Use Camera</span>
                  <span className="xs:hidden">Camera</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog - Mobile Responsive */}
       <Dialog open={openUpload} onOpenChange={setOpenUpload}>
      <DialogContent
        className="
          w-full
          max-w-[95vw]
          sm:max-w-xl
          lg:max-w-3xl
          rounded-2xl
          p-0
        "
      >
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Upload Scheme</DialogTitle>
              <DialogDescription>
                PDF, Word or Image (Max 10MB)
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Upload Area */}
          <label
            htmlFor="scheme-file"
            className="
              lg:col-span-2
              flex flex-col items-center justify-center
              border-2 border-dashed
              rounded-xl
              p-10
              cursor-pointer
              transition
              hover:border-primary
              bg-muted/30
            "
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium">Drag & drop your file here</p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>

            <Input
              id="scheme-file"
              type="file"
              accept=".pdf,.docx,.jpg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading || !!scheme}
              className="hidden"
            />
          </label>

          {/* File Preview */}
          <div className="rounded-xl border p-4 space-y-3">
            <p className="font-medium text-sm">Selected File</p>

            {file ? (
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(file.size / 1024)} KB
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No file selected
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleCameraClick}
              disabled={uploading || !!scheme}
              className="w-full gap-2"
            >
              <Camera className="h-4 w-4" />
              Use Camera
            </Button>
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="px-6 pb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Uploading</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-2 bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpenUpload(false)}
            disabled={uploading}
          >
            Cancel
          </Button>

        <Button
        onClick={handleUpload}
        disabled={!file || uploading || !!scheme}
        className="gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Uploading…" : "Upload & Process"}
      </Button>

        </div>
      </DialogContent>
    </Dialog>

        {/* Processing Redirect Dialog - Fixed Mobile Responsiveness */}
        <Dialog open={showProcessingRedirect} onOpenChange={setShowProcessingRedirect}>
          <DialogContent className="max-w-md rounded-xl w-[95vw] sm:w-full mx-2 sm:mx-0">
            <DialogHeader className="space-y-2 sm:space-y-3 px-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <DialogTitle className="text-lg sm:text-xl">Processing Started!</DialogTitle>
              </div>
              <DialogDescription className="text-sm sm:text-base">
                Your scheme is being processed in the background.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 py-2 px-4 sm:px-6">
              <div className="bg-primary/10 p-3 sm:p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-spin mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-primary">What's happening?</p>
                    <ul className="text-xs sm:text-sm text-primary/90 space-y-1 list-disc list-inside pl-1">
                      <li className="break-words">We are extracting text from your document</li>
                      <li>Processing may take 30-60 seconds</li>
                      <li>You'll receive a notification when ready</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <p className="font-medium text-sm sm:text-base">While you wait, you can:</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/");
                      setShowProcessingRedirect(false);
                    }}
                    className="justify-start h-auto py-2 sm:py-3 hover:bg-primary/5 text-left"
                  >
                    <div className="w-full">
                      <p className="font-medium text-sm sm:text-base">Browse Dashboard</p>
                      <p className="text-xs text-muted-foreground">Check your teaching resources</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/community/lessonNote");
                      setShowProcessingRedirect(false);
                    }}
                    className="justify-start h-auto py-2 sm:py-3 hover:bg-primary/5 text-left"
                  >
                    <div className="w-full">
                      <p className="font-medium text-sm sm:text-base">Plan Lessons</p>
                      <p className="text-xs text-muted-foreground">Check your lesson notes</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/profile-settings");
                      setShowProcessingRedirect(false);
                    }}
                    className="justify-start h-auto py-2 sm:py-3 hover:bg-primary/5 text-left"
                  >
                    <div className="w-full">
                      <p className="font-medium text-sm sm:text-base">Update Profile</p>
                      <p className="text-xs text-muted-foreground">Manage your account</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Button
                onClick={navigateWhileProcessing}
                className="w-full gap-2 h-10 sm:h-11 text-sm sm:text-base"
              >
                Go to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog - Mobile Responsive */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
  <DialogContent className="max-w-lg rounded-xl">
    <DialogHeader className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="bg-destructive/10 p-2 rounded-full">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <DialogTitle className="text-xl text-destructive">
          Delete Scheme of Work
        </DialogTitle>
      </div>
      <DialogDescription className="text-base">
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    {/* Warning Box */}
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2">
      <p className="font-medium">
        You are about to permanently delete:
      </p>
      <p className="text-sm text-muted-foreground truncate">
        {scheme?.title}
      </p>
      <p className="text-sm text-destructive">
        All extracted data will be lost.
      </p>
    </div>

    <DialogFooter className="flex justify-end gap-3 pt-4">
      <Button
        variant="outline"
        onClick={() => setOpenDelete(false)}
        disabled={deleting}
      >
        Cancel
      </Button>

      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={deleting}
        className="gap-2"
      >
        {deleting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Deleting…
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
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