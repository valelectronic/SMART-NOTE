"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RefreshCw, Wifi } from "lucide-react";
import { toast } from "sonner";
import { SchemeCard } from "@/components/SOW/scheme/SchemeCard";
import { EmptyState } from "@/components/SOW/scheme/EmptyState";
import { UploadDialog, ProcessingDialog, DeleteDialog } from "@/components/SOW/scheme/SchemeDialog";

// ✅ Dynamic import for image compression
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
  const [compressingImage, setCompressingImage] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Enhanced fetchScheme with aggressive cache busting
  const fetchScheme = useCallback(
    async (options: { showLoader?: boolean; isRetry?: boolean } = {}) => {
      if (!userId || isFetchingRef.current) return;

      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      fetchAbortControllerRef.current = controller;
      isFetchingRef.current = true;

      if (options.showLoader) {
        setLoading(true);
      }

      try {
        // ✅ Aggressive cache busting
        const res = await fetch(`/api/scheme/currentSOW?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch scheme');
        
        const data = await res.json();

        if (!isMountedRef.current) return;

        if (data.success && data.scheme && data.scheme.processingStatus !== null) {
          setScheme({
            title: data.scheme.sowTitle,
            sowFileKey: data.scheme.sowFileKey,
            uploadedAt: data.scheme.uploadedAt,
            processingStatus: data.scheme.processingStatus,
            sowErrorMessage: data.scheme.sowErrorMessage,
            isManuallyAdded: data.scheme.isManuallyAdded || false,
          });
        } else {
          setScheme(null);
        }
        setNetworkError(false);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        
        console.error("Fetch scheme error:", error);
        
        if (isMountedRef.current) {
          setNetworkError(true);
          
          if (!options.isRetry && retryTimeoutRef.current === null) {
            retryTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                retryTimeoutRef.current = null;
                fetchScheme({ isRetry: true });
              }
            }, 2000);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setHasFetched(true);
        }
        
        isFetchingRef.current = false;
        if (fetchAbortControllerRef.current === controller) {
          fetchAbortControllerRef.current = null;
        }
      }
    },
    [userId]
  );

  // ✅ PRODUCTION-SAFE MOUNT EFFECT - FIXED
  useEffect(() => {
    isMountedRef.current = true;

    // ✅ Production-Safe Sync Check with sessionStorage
    const syncKey = "sow_last_sync";
    const lastSync = sessionStorage.getItem(syncKey);
    const now = Date.now();

    // If last hard sync was more than 2 seconds ago, do a fresh refresh
    if (!lastSync || now - parseInt(lastSync) > 2000) {
      console.log("🔄 Cache refresh triggered - router.refresh()");
      sessionStorage.setItem(syncKey, now.toString());
      router.refresh();
    }

    // Reset states
    setHasFetched(false);
    setScheme(null);
    setLoading(true);

    // ✅ FIXED: Only ONE fetch call with small delay for router.refresh to complete
    let fetchTimer: NodeJS.Timeout | undefined;

    if (userId) {
      fetchTimer = setTimeout(() => {
        if (isMountedRef.current) {
          fetchScheme({ showLoader: true });
        }
      }, 100);
    } else {
      setLoading(false);
      setHasFetched(true);
    }

    return () => {
      isMountedRef.current = false;
      if (fetchTimer) clearTimeout(fetchTimer);
      if (fetchAbortControllerRef.current) fetchAbortControllerRef.current.abort();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [userId, router, fetchScheme]);

  // ✅ Visibility handling with throttle
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId && hasFetched && isMountedRef.current && !isFetchingRef.current) {
        const syncKey = "sow_last_sync";
        const lastSync = sessionStorage.getItem(syncKey);
        const now = Date.now();

        // Only refresh if last sync was more than 2 seconds ago
        if (!lastSync || now - parseInt(lastSync) > 2000) {
          console.log("👁️ Tab visible - refreshing data");
          sessionStorage.setItem(syncKey, now.toString());
          router.refresh();
          
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchScheme({ showLoader: false });
            }
          }, 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, fetchScheme, hasFetched, router]);

  // ✅ Polling for processing status
  useEffect(() => {
    const shouldPoll = 
      scheme?.processingStatus === 'processing' || 
      scheme?.processingStatus === 'pending';
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    if (!shouldPoll) return;

    console.log("⏱️ Starting poll for processing status");
    
    pollIntervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible" && isMountedRef.current && !isFetchingRef.current) {
        fetchScheme({ showLoader: false });
      }
    }, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [scheme?.processingStatus, fetchScheme]);

  const handleNavigateToEdit = useCallback(() => {
    router.prefetch("/community/schemeOfWork/editScheme");
    setNavigating(true);
    router.push("/community/schemeOfWork/editScheme");
  }, [router]);

  const handleNavigateToView = useCallback(() => {
    router.prefetch("/community/schemeOfWork/viewScheme");
    setNavigating(true);
    router.push("/community/schemeOfWork/viewScheme");
  }, [router]);

  const handleNavigateToManualAdd = useCallback(() => {
    router.prefetch("/community/schemeOfWork/editScheme");
    router.push("/community/schemeOfWork/editScheme");
  }, [router]);

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
    
    input.oncancel = () => {
      input.remove();
    };

    input.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setNetworkError(false);
    
    try {
      let fileToUpload = file;

      if (file.type.startsWith('image/')) {
        setCompressingImage(true);
        toast.info("Optimizing image...", { duration: 2000 });
        
        const imageCompression = await getImageCompression();
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
        });
        
        setCompressingImage(false);
      }

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
      
      const uploadTimeout = setTimeout(() => abortController.abort(), 60000);

      const uploadResult = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);

        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error("Upload timeout. Check your connection."));
        });

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
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
        isManuallyAdded: false,
      };

      setScheme(newScheme);
      setFile(null);
      setOpenUpload(false);
      setHasShownStatusToast(false);
      toast.success("Scheme uploaded!");
      setShowProcessingRedirect(true);

      // Refresh after upload
      setTimeout(() => {
        fetchScheme({ showLoader: false });
      }, 1000);

    } catch (error: unknown) {
      console.error("Upload error:", error);
      setNetworkError(true);
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        duration: 5000,
      });
    } finally {
      setUploading(false);
      setCompressingImage(false);
      setProgress(0);
      uploadAbortControllerRef.current = null;
    }
  }, [file, fetchScheme]);

  const handleCancelUpload = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      toast.info("Upload cancelled");
    }
  }, []);

  const navigateWhileProcessing = useCallback(() => {
    toast.info("We'll notify you when ready!", { duration: 3000 });
    setShowProcessingRedirect(false);
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (scheme?.processingStatus === 'complete' && !hasShownStatusToast) {
      toast.success("Scheme ready!", {
        duration: 6000,
        action: {
          label: "Edit Now",
          onClick: handleNavigateToEdit,
        },
      });
      setHasShownStatusToast(true);
    } else if (scheme?.processingStatus === 'failed' && !hasShownStatusToast) {
      toast.error(scheme.sowErrorMessage || "Processing failed", {
        duration: 6000,
      });
      setHasShownStatusToast(true);
    }
  }, [scheme?.processingStatus, scheme?.sowErrorMessage, hasShownStatusToast, handleNavigateToEdit]);

  const handleDeleteScheme = useCallback(async () => {
    if (!scheme?.sowFileKey) {
      toast.error("No file to delete");
      return;
    }

    setDeleting(true);

    try {
      if (!scheme.isManuallyAdded) {
        await fetch(
          `/api/cloudinary/SOWdelete?key=${encodeURIComponent(scheme.sowFileKey)}`,
          { method: "DELETE" }
        );
      }

      const dbRes = await fetch("/api/scheme/deleteScheme", { method: "DELETE" });
      const dbData = await dbRes.json();
      
      if (!dbData.success) throw new Error(dbData.error);

      setScheme(null);
      setHasFetched(true);
      setOpenDelete(false);
      setHasShownStatusToast(false);
      setNetworkError(false);
      setFile(null);
      toast.success("Deleted");

    } catch (error: unknown) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [scheme]);

  const handleRetryProcessing = useCallback(async () => {
    if (!scheme?.sowFileKey) return;

    try {
      toast.info("Retrying...");
      
      const res = await fetch("/api/scheme/retryProcessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sowFileKey: scheme.sowFileKey }),
      });

      const result = await res.json();
      
      if (result.success) {
        setScheme(prev => prev ? { 
          ...prev, 
          processingStatus: 'pending', 
          sowErrorMessage: undefined 
        } : null);
        setHasShownStatusToast(false);
        toast.success("Retry started");
      } else {
        toast.error(result.error || "Retry failed");
      }
    } catch (error) {
      toast.error("Network error");
    }
  }, [scheme?.sowFileKey]);

  const handleManualRetry = useCallback(() => {
    setNetworkError(false);
    setLoading(true);
    setScheme(null);
    setHasFetched(false);
    
    // Force refresh
    const syncKey = "sow_last_sync";
    sessionStorage.setItem(syncKey, Date.now().toString());
    router.refresh();
    
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchScheme({ showLoader: true });
      }
    }, 100);
  }, [fetchScheme, router]);

  // ✅ Show loading skeleton
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
              <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed animate-in slide-in-from-top-2">
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
          onConfirm={handleDeleteScheme}
        />
      </div>
    </div>
  );
}