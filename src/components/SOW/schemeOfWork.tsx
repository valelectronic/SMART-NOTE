"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, Calendar, Edit, Camera, NotebookText } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/app/loading";
import { deleteFromCloudinary } from "@/lib/cloudinary";


type CloudinarySignature = {
  signature: string,
  timestamp: number,
  apiKey: string
}


interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string; 
}

interface Scheme {
  title: string;
  sowFileKey: string;
  uploadedAt: string;
}


// Fetches the Cloudinary signature from your backend API
async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const timestamp = Math.floor(Date.now() / 1000);
  const res = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp, folder: "sow_uploads" }), // Pass folder for better security
  });
  if (!res.ok) throw new Error("Failed to fetch Cloudinary signature");
  return res.json();
}





export default function SchemeOfWorkPage({ initialUserId }: { initialUserId: string | null }) {
    const userId = initialUserId;
  const router = useRouter();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUpload, setOpenUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prevSowFileKey, setPrevSowFileKey] = useState<string | null>(null);

  // Check for existing scheme
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // For demo - set to null to see empty state
      setScheme(null);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

const SOW_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for SOW files
  
// Handle file upload
  const handleUpload = async () => {
   if (!file) return toast.error("Please select a file first.");
    if (!userId) return toast.error("User session expired. Please log in.");
    if (file.size > SOW_MAX_FILE_SIZE) {
        return toast.error("File size too large. Please upload under 10MB.");
    }

    setUploading(true);
    setProgress(0);
    let uploadedPublicId: string | undefined = undefined;

    try {
        // --- 1. Get Signature & Upload File Directly to Cloudinary using XHR ---
        const { signature, timestamp, apiKey } = await getCloudinarySignature();
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("api_key", apiKey);
        uploadForm.append("timestamp", String(timestamp));
        uploadForm.append("signature", signature);
        uploadForm.append("folder", "sow_uploads"); 

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME is not set.");
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        const cloudData: CloudinaryUploadResponse = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", uploadUrl);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    setProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
            xhr.onload = () =>
                xhr.status >= 200 && xhr.status < 300
                    ? resolve(JSON.parse(xhr.responseText))
                    : reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
            xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."));
            xhr.send(uploadForm);
        });

        uploadedPublicId = cloudData.public_id; // Store ID for potential cleanup

        // --- 2. Notify Backend API (Calls uploadSchemeOfWorkController) ---
        const backendForm = new FormData();
        backendForm.append("sowFileUrl", cloudData.secure_url); 
        backendForm.append("sowFileKey", cloudData.public_id); 
        backendForm.append("userId", userId); // Use the authenticated ID

        // Include the previous key for the server to clean up the old file
        if (scheme?.sowFileKey) {
            backendForm.append("prevSowFileKey", scheme.sowFileKey);
        }

        const apiResponse = await fetch("/api/scheme/extract", {
            method: "POST",
            body: backendForm,
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok || result.success === false) {
            // CRITICAL: If DB/Job fails, delete the NEW file from Cloudinary immediately
            if(uploadedPublicId) await deleteFromCloudinary(uploadedPublicId); 
            throw new Error(result.error || "Failed to initiate scheme extraction on the server.");
        }
        
        // --- 3. Success State Update ---
        const newScheme: Scheme = {
            title: result.sowTitle || file.name, // Use the server-derived title if available
            sowFileKey: result.sowFileKey,
            uploadedAt: new Date().toISOString(), 
        };
        
        setScheme(newScheme);
        setFile(null);
        setOpenUpload(false);
        toast.success("Scheme uploaded and processing started.");
        
        // Navigate or update view
        router.push("/community/schemeOfWork/editScheme");

    } catch (error: any) {
        console.error("Upload Error:", error);
        toast.error(error.message || "An unknown error occurred during upload.");
    } finally {
        setUploading(false);
        setProgress(0);
    }
    
    };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loading/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            Scheme of Work
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your teaching scheme and lesson plans
          </p>
        </div>

        {scheme ? (
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <NotebookText className="h-5 w-5 sm:h-6 sm:w-6 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl truncate">{scheme.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1 flex-wrap">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      Uploaded {new Date(scheme.uploadedAt).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  
                  <Button 
                    onClick={() => router.push("/community/schemeOfWork/editScheme")}
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden xs:inline">Edit Scheme</span>
                    <span className="xs:hidden">Edit</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setOpenUpload(true)}
                    className="flex-1 gap-2"
                    size="sm"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden xs:inline">Upload New</span>
                    <span className="xs:hidden">New</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Empty State */
          <Card className="text-center border-dashed">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-16 px-4 sm:px-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                No Scheme of Work
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
                Get started by uploading your scheme of work. You can upload a file or use your camera to capture a photo.
              </p>
              
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center">
                <Button 
                  onClick={() => setOpenUpload(true)}
                  className="gap-2"
                  size="sm"
                >
                  <Upload className="h-4 w-4" />
                  Upload Scheme
                </Button>
                <Button 
                  variant="outline"
                  className="gap-2"
                  size="sm"
                  onClick={() => toast.info("Camera feature coming soon")}
                >
                  <Camera className="h-4 w-4" />
                  Use Camera
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={openUpload} onOpenChange={setOpenUpload}>
          <DialogContent className="w-[95vw] max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5" />
                Upload Scheme
              </DialogTitle>
              <DialogDescription className="text-sm">
                Select your scheme file. Supported formats: PDF, Word, JPG, PNG
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheme-file" className="text-sm">Choose File</Label>
                <Input
                  id="scheme-file"
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="min-w-0"
                />
              </div>

              {file && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NEW: Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progress < 100 ? "Uploading..." : "Processing..."}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-2 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setOpenUpload(false)}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full sm:w-auto gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress < 100 ? `Uploading (${progress}%)` : "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Edit
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