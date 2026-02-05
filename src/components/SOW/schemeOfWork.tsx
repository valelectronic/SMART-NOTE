"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RefreshCw, Wifi, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SchemeCard } from "@/components/SOW/scheme/SchemeCard";
import { EmptyState } from "@/components/SOW/scheme/EmptyState";
import { UploadDialog, ProcessingDialog, DeleteDialog } from "@/components/SOW/scheme/SchemeDialog";

// ✅ Constants
const UPLOAD_TIMEOUT = 120_000; // 2 minutes for slow networks
const PROGRESS_UPDATE_THROTTLE = 200; // ms
const POLL_INTERVAL = 15000; // 15 seconds

// ✅ Lazy load image compression
let imageCompressionModule: any = null;

async function getImageCompression() {
  if (!imageCompressionModule) {
    imageCompressionModule = await import('browser-image-compression');
  }
  return imageCompressionModule.default;
}

export interface Scheme {
  title: string;
  sowFileKey: string;
  uploadedAt: string;
  processingStatus: "pending" | "processing" | "complete" | "failed";
  sowErrorMessage?: string;
  isManuallyAdded?: boolean;
}

export type CloudinarySignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
}

let cachedSignature: { data: CloudinarySignature; expires: number } | null = null;

export async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const now = Date.now();
  
  if (cachedSignature && cachedSignature.expires > now) {
    return cachedSignature.data;
  }

  const timestamp = Math.floor(now / 1000);
  const res = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp, folder: "sow_uploads" }),
  });

  if (!res.ok) throw new Error("Failed to fetch upload signature");
  
  const data = await res.json();
  cachedSignature = { data, expires: now + 300000 };
  
  return data;
}

function SchemeCardSkeleton() {
  return (
    <Card className="w-full shadow-xl border-2 animate-pulse">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-2 rounded-xl bg-muted w-10 h-10 sm:w-12 sm:h-12" />
          <div className="flex-1 space-y-2">
            <div className="h-5 sm:h-6 bg-muted rounded w-40 sm:w-48" />
            <div className="h-3 sm:h-4 bg-muted rounded w-28 sm:w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-4">
        <div className="h-24 sm:h-32 bg-muted rounded-xl" />
      </CardContent>
    </Card>
  );
}

// ✅ Simplified toast helper
const showToast = {
  success: (msg: string, opts?: any) => 
    toast.success(msg, { icon: <CheckCircle2 className="h-5 w-5" />, duration: 4000, ...opts }),
  error: (msg: string, opts?: any) => 
    toast.error(msg, { icon: <AlertCircle className="h-5 w-5" />, duration: 5000, ...opts }),
  loading: (msg: string) => 
    toast.loading(msg, { icon: <Loader2 className="h-5 w-5 animate-spin" /> }),
};

export default function SchemeOfWorkPage({ initialUserId }: { initialUserId: string | null }) {
  const [userId] = useState(initialUserId);
  const router = useRouter();
  
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true); 
  const [hasFetched, setHasFetched] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [showProcessingRedirect, setShowProcessingRedirect] = useState(false);
  const [hasShownStatusToast, setHasShownStatusToast] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false); // ✅ Added back
  const [ocrStatus, setOcrStatus] = useState<string>(""); // ✅ Added back
  
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdateRef = useRef(0);

  const fetchScheme = useCallback(
    async (showLoader = false) => {
      if (!userId || isFetchingRef.current) return;

      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      fetchAbortControllerRef.current = controller;
      isFetchingRef.current = true;

      if (showLoader) setLoading(true);

      try {
        const res = await fetch(`/api/scheme/currentSOW?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        if (!isMountedRef.current) return;

        if (data.success && data.scheme && (data.scheme.title || data.scheme.sowFileKey)) {
          const isManual = !data.scheme.sowFileKey;
          
          setScheme({
            title: data.scheme.title || "Untitled Scheme",
            sowFileKey: data.scheme.sowFileKey || "",
            uploadedAt: data.scheme.uploadedAt,
            processingStatus: isManual ? "complete" : (data.scheme.processingStatus || "pending"),
            sowErrorMessage: data.scheme.sowErrorMessage,
            isManuallyAdded: isManual,
          });
        } else {
          setScheme(null);
        }
        
        setNetworkError(false);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Fetch error:", error);
          if (isMountedRef.current) setNetworkError(true);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setHasFetched(true);
        }
        isFetchingRef.current = false;
      }
    },
    [userId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    
    if (userId) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) fetchScheme(true);
      }, 50);
      
      return () => {
        isMountedRef.current = false;
        clearTimeout(timer);
        if (fetchAbortControllerRef.current) fetchAbortControllerRef.current.abort();
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      };
    } else {
      setLoading(false);
      setHasFetched(true);
    }
  }, [userId, fetchScheme]);

  useEffect(() => {
    const shouldPoll = 
      scheme?.processingStatus === 'processing' || 
      scheme?.processingStatus === 'pending';
    
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    
    if (!shouldPoll) return;

    const poll = async () => {
      if (document.visibilityState === "visible" && isMountedRef.current && !isFetchingRef.current) {
        await fetchScheme(false);
      }
      
      if (isMountedRef.current && shouldPoll) {
        pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL);
      }
    };

    pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [scheme?.processingStatus, fetchScheme]);

  const handleNavigateToEdit = useCallback(() => {
    setNavigating(true);
    router.push("/community/schemeOfWork/editScheme");
  }, [router]);

  const handleNavigateToView = useCallback(() => {
    setNavigating(true);
    router.push("/community/schemeOfWork/viewScheme");
  }, [router]);

  const handleNavigateToManualAdd = useCallback(() => {
    router.push("/community/schemeOfWork/editScheme");
  }, [router]);

  const handleCameraClick = useCallback(() => {
    if (typeof window === 'undefined') return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if ('ontouchstart' in window) input.capture = "environment";

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        setFile(target.files[0]);
        setOpenUpload(true);
      }
      input.remove();
    };
    
    input.oncancel = () => input.remove();
    input.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      showToast.error("Please select a file");
      return;
    }

    setUploading(true);
    setProgress(0);
    setNetworkError(false);
    lastProgressUpdateRef.current = 0;
    
    const uploadToastId = showToast.loading("Preparing upload...");
    
    try {
      let fileToUpload = file;

      // Compress images
      if (file.type.startsWith('image/')) {
        setCompressingImage(true);
        toast.loading("Optimizing image...", { id: uploadToastId });
        const imageCompression = await getImageCompression();
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
        });
        setCompressingImage(false);
      }

      // OCR with throttled progress
      toast.loading("Reading document...", { id: uploadToastId });
      const { extractTextFromSOWClient } = await import("@/services/sow/ocrClient");
      const { rawText } = await extractTextFromSOWClient(fileToUpload, (stage, percent) => {
        const now = Date.now();
        if (now - lastProgressUpdateRef.current > PROGRESS_UPDATE_THROTTLE) {
          setProgress(percent);
          setOcrStatus(`Reading text (${percent}%)`);
          toast.loading(`Reading text (${percent}%)`, { id: uploadToastId });
          lastProgressUpdateRef.current = now;
        }
      });

      // Upload to Cloudinary
      setProgress(0);
      setOcrStatus("Uploading to cloud...");
      lastProgressUpdateRef.current = 0;
      toast.loading("Uploading...", { id: uploadToastId });

      const { signature, timestamp, apiKey } = await getCloudinarySignature();
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const cloudForm = new FormData();
      cloudForm.append("file", fileToUpload); 
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", String(timestamp));
      cloudForm.append("signature", signature);
      cloudForm.append("folder", "sow_uploads");

      const abortController = new AbortController();
      uploadAbortControllerRef.current = abortController;
      
      const uploadTimeout = setTimeout(() => abortController.abort(), UPLOAD_TIMEOUT);

      const uploadResult = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);

        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error("Upload timeout - check connection"));
        });

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            if (now - lastProgressUpdateRef.current > PROGRESS_UPDATE_THROTTLE) {
              const uploadPercent = Math.round((e.loaded / e.total) * 100);
              setProgress(uploadPercent);
              setOcrStatus(`Uploading ${uploadPercent}%`);
              toast.loading(`Uploading ${uploadPercent}%`, { id: uploadToastId });
              lastProgressUpdateRef.current = now;
            }
          }
        };

        xhr.onload = () => {
          clearTimeout(uploadTimeout);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => {
          clearTimeout(uploadTimeout);
          reject(new Error("Network error"));
        };

        xhr.send(cloudForm);
      });

      clearTimeout(uploadTimeout);

      // Save to DB
      toast.loading("Finalizing...", { id: uploadToastId });
      setOcrStatus("Finalizing...");

      const res = await fetch("/api/scheme/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sowFileKey: uploadResult.public_id,
          sowFileUrl: uploadResult.secure_url,
          rawText: rawText,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setScheme({
        title: result.sowTitle || file.name,
        sowFileKey: uploadResult.public_id,
        uploadedAt: new Date().toISOString(),
        processingStatus: 'pending',
        isManuallyAdded: false,
      });
      
      setFile(null);
      setOpenUpload(false);
      setHasShownStatusToast(false);
      
      showToast.success("Scheme uploaded! We'll notify you when it's ready.");
      toast.dismiss(uploadToastId);
      
      setShowProcessingRedirect(true);
      setTimeout(() => fetchScheme(false), 1000);

    } catch (error: unknown) {
      console.error("Upload error:", error);
      setNetworkError(true);
      showToast.error(error instanceof Error ? error.message : "Upload failed");
      toast.dismiss(uploadToastId);
    } finally {
      setUploading(false);
      setCompressingImage(false);
      setProgress(0);
      setOcrStatus("");
      uploadAbortControllerRef.current = null;
    }
  }, [file, fetchScheme]);

  const handleCancelUpload = useCallback(() => {
    uploadAbortControllerRef.current?.abort();
    showToast.success("Upload cancelled");
  }, []);

  const navigateWhileProcessing = useCallback(() => {
    showToast.success("We'll notify you when ready!");
    setShowProcessingRedirect(false);
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (scheme?.processingStatus === 'complete' && !hasShownStatusToast) {
      showToast.success("Your scheme is ready! ", {
        action: { label: "Edit Now", onClick: handleNavigateToEdit }
      });
      setHasShownStatusToast(true);
    } else if (scheme?.processingStatus === 'failed' && !hasShownStatusToast) {
      showToast.error(scheme.sowErrorMessage || "Processing failed");
      setHasShownStatusToast(true);
    }
  }, [scheme?.processingStatus, scheme?.sowErrorMessage, hasShownStatusToast, handleNavigateToEdit]);

  const handleDeleteEverything = useCallback(async () => {
    if (!scheme) return;

    setDeleting(true);
    const deleteToastId = showToast.loading("Deleting...");

    try {
      const dbRes = await fetch("/api/scheme/deleteScheme", { 
        method: "DELETE",
        cache: 'no-store',
      });
      
      const dbData = await dbRes.json();
      if (!dbData.success) throw new Error(dbData.error || "Delete failed");

      if (scheme.sowFileKey && !scheme.isManuallyAdded) {
        fetch(`/api/cloudinary/SOWdelete?key=${encodeURIComponent(scheme.sowFileKey)}`, { method: "DELETE" })
          .catch(console.error);
      }

      setScheme(null);
      setHasFetched(true);
      setOpenDelete(false);
      setHasShownStatusToast(false);

      showToast.success("Scheme deleted successfully");
      toast.dismiss(deleteToastId);

      router.refresh();

    } catch (error: any) {
      console.error("Delete error:", error);
      showToast.error("Delete failed");
      toast.dismiss(deleteToastId);
    } finally {
      setDeleting(false);
    }
  }, [scheme, router]);

  const handleRetryProcessing = useCallback(async () => {
    if (!scheme?.sowFileKey) return;

    const retryToastId = showToast.loading("Retrying...");

    try {
      const res = await fetch("/api/scheme/retryProcessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sowFileKey: scheme.sowFileKey }),
      });

      const result = await res.json();
      
      if (result.success) {
        setScheme(prev => prev ? { ...prev, processingStatus: 'pending', sowErrorMessage: undefined } : null);
        setHasShownStatusToast(false);
        showToast.success("Retry started successfully");
        toast.dismiss(retryToastId);
      } else {
        throw new Error(result.error || "Retry failed");
      }
    } catch (error) {
      showToast.error("Retry failed - please try again");
      toast.dismiss(retryToastId);
    }
  }, [scheme?.sowFileKey]);

  const handleManualRetry = useCallback(() => {
    setNetworkError(false);
    fetchScheme(true);
  }, [fetchScheme]);

  if (loading || !hasFetched) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <div className="h-8 sm:h-10 bg-muted rounded w-48 sm:w-64 mx-auto mb-2 sm:mb-3 animate-pulse" />
            <div className="h-5 sm:h-6 bg-muted rounded w-64 sm:w-96 mx-auto animate-pulse" />
          </div>
          <SchemeCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {networkError && (
          <div className="mb-4 p-3 sm:p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-destructive truncate">Connection Issue</p>
                  <p className="text-[10px] sm:text-xs text-destructive/80 truncate">Check your network</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleManualRetry}
                className="flex-shrink-0 h-8 px-2 sm:px-3 text-xs"
              >
                <RefreshCw className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Retry</span>
              </Button>
            </div>
          </div>
        )}

        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
            Scheme of Work
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            {!scheme 
              ? "Choose how you'd like to create your scheme"
              : scheme.isManuallyAdded
              ? "View your manually created scheme"
              : scheme.processingStatus === 'complete'
              ? "Your scheme is ready"
              : "Processing your scheme"}
          </p>
        </div>

        {uploading ? (
          <SchemeCardSkeleton />
        ) : scheme ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <SchemeCard
              scheme={scheme}
              navigating={navigating}
              deleting={deleting}
              onNavigateToEdit={handleNavigateToEdit}
              onNavigateToView={handleNavigateToView}
              onDelete={() => setOpenDelete(true)}
              onRetryProcessing={handleRetryProcessing}
            />
            
            {scheme.processingStatus === "failed" && (
              <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Extraction failed. You can retry above or start fresh below.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setOpenUpload(true)} className="flex-1">
                    Upload New
                  </Button>
                  <Button variant="outline" onClick={handleNavigateToManualAdd} className="flex-1">
                    Create Manually
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            onUploadClick={() => setOpenUpload(true)}
            onCameraClick={handleCameraClick}
            onManualAddClick={handleNavigateToManualAdd}
          />
        )}

        <UploadDialog
          open={openUpload}
          onOpenChange={setOpenUpload}
          file={file}
          onFileChange={setFile}
          uploading={uploading}
          compressingImage={compressingImage}
          ocrStatus={ocrStatus}
          progress={progress}
          onUpload={handleUpload}
          onCancel={handleCancelUpload}
        />

        <ProcessingDialog
          open={showProcessingRedirect}
          onOpenChange={setShowProcessingRedirect}
          onGoToDashboard={navigateWhileProcessing}
        />

        <DeleteDialog
          open={openDelete}
          onOpenChange={setOpenDelete}
          schemeTitle={scheme?.title || ""}
          isManuallyAdded={scheme?.isManuallyAdded || false}
          deleting={deleting}
          onConfirm={handleDeleteEverything}
        />
      </div>
    </div>
  );
}