// src/components/profile/ProfileCard.tsx
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { updateProfileSettingsController } from "@/controllers/settings.controller";
import { signOut } from "@/lib/db/auth.client";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { LogOut, Pencil, Loader2} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "../ui/label";


type CloudinarySignature = {
  signature: string,
  timestamp: number,
  apiKey: string
}

type ProfileProps = {
  fullName: string;
  fileUrl: string | null;
 
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string; // Add other properties you might use later
  // ...other Cloudinary fields
}

export default function ProfileCard({ profile }: { profile: ProfileProps | null }) {
  const router = useRouter();
  const [openUpload, setOpenUpload] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.fileUrl ?? "/logo.jpg");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [prevPublicId, setPrevPublicId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.fileUrl) {
      setAvatarUrl(profile.fileUrl);
      setPrevPublicId(getPublicId(profile.fileUrl));
    }
    
  }, [profile]);

  //Effect for file preview
  useEffect(()=>{
    if(file){
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
      }
    }else{
      setFilePreview(null);
    }
  }, [file]);

  // Cloudinary upload signature fetcher

  async function getCloudinarySignature(): Promise<CloudinarySignature> {
    const timestamp = Math.floor(Date.now() / 1000);
    const res = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp }),
    });
    if (!res.ok) throw new Error("Failed to fetch signature");
    return res.json();
  }

  const getPublicId = (url: string) => {
    try {
      const parts = url.split("/");
      const noVersion = parts.filter(p => !/^v\d+$/.test(p));
      const uploadIndex = noVersion.findIndex(p => p === "upload");
      const publicPath = noVersion.slice(uploadIndex + 1).join("/");
      return publicPath.replace(/\.[^/.]+$/, "");
    } catch {
      return "";
    }
  };

  const MAX_FILE_SIZE = 1 * 1024 * 1024;

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");

    if (file.size > MAX_FILE_SIZE) {
      return toast.error("File size too large. Please upload under 1MB.");
    }

    setIsUploading(true);
    setProgress(0);
    try {
      const { signature, timestamp, apiKey } = await getCloudinarySignature();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", "skillShare");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const res = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve(JSON.parse(xhr.responseText))
            : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(form);
      });

      // Save to DB
      const dbForm = new FormData();
      dbForm.append("fileUrl", res.secure_url);
      dbForm.append("thumbnailUrl", res.secure_url);

      const result = await updateProfileSettingsController(dbForm);
      if (result?.success === false) throw new Error(result.error);

      // Delete previous avatar
      if (prevPublicId) {
        await deleteFromCloudinary(prevPublicId);
      }

      setAvatarUrl(res.secure_url);
      setPrevPublicId(getPublicId(res.secure_url));
      toast.success("Profile picture updated! 🎉");
      setOpenUpload(false);
      setFile(null);
      setFilePreview(null);

    } catch (error) {
      console.log(error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

//handle logout
 const handleLogout = async () => {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  };
// Shorten name for display
  function shortenName(name: string, maxLength = 15) {
    return name.length > maxLength ? name.slice(0, maxLength) + "…" : name;
  }

  return (
          <Card className="rounded-xl border border-border/40 bg-background">
  <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
    {/* Avatar with Edit - Mobile Optimized */}
    <div className="relative group">
      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogTrigger asChild>
          <div className="cursor-pointer relative">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-background shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <AvatarImage src={avatarUrl} alt="Profile picture" />
              <AvatarFallback className="text-lg font-semibold">
                {profile?.fullName
                  ? profile.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              className="absolute -top-1 -right-1 rounded-full w-8 h-8 sm:w-9 sm:h-9 shadow-md  border hover:bg-accent"
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </DialogTrigger>
        
        {/* Upload Dialog */}
        <DialogContent className="w-[95vw] max-w-md rounded-xl sm:max-w-lg">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Pencil className="h-5 w-5" />
                Update Profile Picture
              </DialogTitle>
            </DialogHeader>
            {/* File Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Image</Label>
              <Input 
                type="file" 
                accept="image/*" 
                disabled={isUploading}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="min-w-0"
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 1MB. Recommended aspect ratio: 1:1.
              </p>
            </div>

            {/* Preview & Clear */}
            {filePreview && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={filePreview} alt="Preview" />
                  <AvatarFallback>New</AvatarFallback>
                </Avatar>
                <p className="text-sm flex-1 truncate">{file?.name}</p>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <Pencil className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}


            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
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

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenUpload(false);
                  setFile(null); 
                }}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full sm:w-auto gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Upload Picture
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    {/* Name with Tooltip */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-semibold max-w-[200px] sm:max-w-xs truncate px-4">
              {profile?.fullName ? shortenName(profile.fullName, 20) : "User"}
            </h2>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{profile?.fullName ?? "User"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    {/* Actions - Mobile Optimized */}
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {/* Logout Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-[95vw] max-w-md rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Confirm Logout
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to log out of your account?
            </p>
          </DialogHeader>
          
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              className="w-full sm:w-auto gap-2"
            >
              <LogOut className="h-4 w-4" />
              Yes, Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </CardContent>
</Card>
  );
}