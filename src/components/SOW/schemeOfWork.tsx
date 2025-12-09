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
import { 
  Loader2, Upload, FileText, Calendar, Edit, Camera, NotebookText, 
  Trash2, AlertTriangle, Eye 
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/app/loading";

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

async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const timestamp = Math.floor(Date.now() / 1000);
  const res = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp, folder: "sow_uploads" }),
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
  const [openDelete, setOpenDelete] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function fetchCurrentScheme() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/scheme/currentSOW");
        const data = await res.json();

        if (data.success && data.scheme) {
          setScheme({
            title: data.scheme.sowTitle,
            sowFileKey: data.scheme.sowFileKey,
            uploadedAt: data.scheme.uploadedAt,
          });
        } else {
          setScheme(null);
        }
      } catch (error) {
        console.error("Failed to fetch current scheme:", error);
        toast.error("Could not load your scheme data.");
        setScheme(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentScheme();
  }, [userId]);

  const SOW_MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleUpload = async () => {
    if (scheme) {
      return toast.error("You already have a Scheme. Delete it first to upload a new one.");
    }
    if (!file) return toast.error("Please select a file first.");
    if (!userId) return toast.error("User session expired. Please log in.");
    if (file.size > SOW_MAX_FILE_SIZE) {
      return toast.error("File size too large. Please upload under 10MB.");
    }

    setUploading(true);
    setProgress(0);

    try {
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

      const backendForm = new FormData();
      backendForm.append("sowFileUrl", cloudData.secure_url);
      backendForm.append("sowFileKey", cloudData.public_id);
      backendForm.append("userId", userId);
      const apiResponse = await fetch("/api/scheme/extract", {
        method: "POST",
        body: backendForm,
      });

      const result = await apiResponse.json();
      if (!result.success) throw new Error(result.error || "Upload failed");

      const newScheme: Scheme = {
        title: result.sowTitle || file.name,
        sowFileKey: result.sowFileKey,
        uploadedAt: new Date().toISOString(),
      };
      
      setScheme(newScheme);
      setFile(null);
      setOpenUpload(false);
      toast.success("Scheme uploaded and processing started.");
      
      router.push("/community/schemeOfWork/editScheme");

    } catch (error: unknown) {
      if(error instanceof Error){
        toast.error(error.message || "An unknown error occurred during upload.");
      }
      else{
        toast.error("An unknown error occurred during upload.");
      }
      console.error("Upload Error:", error);
      
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  

  // Delete Scheme Handler
 const handleDelete = async () => {
  if (!scheme?.sowFileKey) {
    return toast.error("No file key found to delete.");
  }

  setDeleting(true);

  try {
    const res = await fetch(
      `/api/cloudinary/SOWdelete?key=${encodeURIComponent(scheme.sowFileKey)}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!data.success) throw new Error(data.error || "Failed to delete scheme");

    toast.success("Scheme deleted successfully");
    setScheme(null);
    setOpenDelete(false);
  } catch (error: unknown) {
    console.error("Delete Error:", error);
    toast.error(error instanceof Error ? error.message : "An unknown error occurred during deletion.");
  } finally {
    setDeleting(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Scheme of Work
          </h1>
          <p className="text-muted-foreground text-lg">
            {scheme ? "Manage your current scheme" : "Upload your scheme to get started"}
          </p>
        </div>

        {scheme ? (
          <Card className="w-full">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <NotebookText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-2xl">{scheme.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Uploaded {new Date(scheme.uploadedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Action Buttons */}
              <div className="bg-muted/50 rounded-xl p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => router.push("/community/schemeOfWork/editScheme")}
                    className="h-12 gap-3 text-base"
                    size="lg"
                  >
                    <Edit className="h-5 w-5" />
                    Edit Scheme
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/community/schemeOfWork/viewSow")}
                    
                    className="h-12 gap-3 text-base"
                    size="lg"
                  >
                    <Eye className="h-5 w-5" />
                    View Scheme
                  </Button>
                </div>
              </div>

              {/* Delete Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Manage Scheme</h3>
                  <p className="text-muted-foreground">
                    Delete your current scheme to upload a new one
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setOpenDelete(true)}
                  className="gap-3 h-11 text-base border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  size="lg"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Scheme
                </Button>
              </div>

              {/* Upload Disabled Message */}
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Upload Disabled</p>
                    <p className="text-sm text-muted-foreground">
                      You can only have one scheme at a time. Delete the current scheme to upload a new one.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Empty State */
          <Card className="w-full text-center border-2 border-dashed">
            <CardContent className="pt-12 pb-16 px-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                No Scheme of Work
              </h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Get started by uploading your scheme of work. You can upload a file or use your camera to capture a photo.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setOpenUpload(true)}
                  className="gap-3 h-12 text-base"
                  size="lg"
                >
                  <Upload className="h-5 w-5" />
                  Upload Scheme
                </Button>
                <Button 
                  variant="outline"
                  className="gap-3 h-12 text-base"
                  size="lg"
                  onClick={() => toast.info("Camera feature coming soon!!")}
                >
                  <Camera className="h-5 w-5" />
                  Use Camera
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={openUpload} onOpenChange={setOpenUpload}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl">Upload Scheme</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Select your scheme file. Supported formats: PDF, Word, JPG, PNG (Max 10MB)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <Label htmlFor="scheme-file" className="text-base">Choose File</Label>
                <Input
                  id="scheme-file"
                  type="file"
                  accept=".pdf,.docx,.jpg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading || !!scheme}
                  className="h-11 text-base"
                />
              </div>

              {file && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-base truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span>{progress < 100 ? "Uploading..." : "Processing..."}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-3 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setOpenUpload(false)}
                disabled={uploading}
                className="h-11 text-base w-full sm:w-auto"
              >
                Cancel 
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading || !!scheme}
                className="h-11 text-base w-full sm:w-auto gap-3"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {progress < 100 ? `Uploading (${progress}%)` : "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload & Edit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDelete} onOpenChange={setOpenDelete}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-xl text-destructive">
                  Delete Scheme of Work
                </DialogTitle>
              </div>
              <div className="space-y-4 text-base">
                <span>This action cannot be undone. This will permanently delete your scheme of work file and remove it from our servers.</span>
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base">Your current scheme will be lost</span>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base">
                      You will be able to upload a new scheme after deletion
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setOpenDelete(false)}
                disabled={deleting}
                className="h-11 text-base w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="destructive"
                className="h-11 text-base w-full sm:w-auto gap-3"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Delete Scheme
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